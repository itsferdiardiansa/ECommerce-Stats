import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as argon2 from 'argon2'
import { randomUUID, randomBytes } from 'crypto'
import { getUserByEmail } from '@rufieltics/db/domains/identity/user'
import { OrganizationMembers } from '@rufieltics/db/domains/identity/organization'
import { Sessions, Totp, RecoveryCodes } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import { MailPriority } from '@/modules/mail/mail.constants'
import { renderEmail } from '@rufieltics/emails'
import { LoginAnomalyService, RiskSignal } from './login-anomaly.service'
import { TotpService } from './totp.service'
import { MfaService } from './mfa.service'
import { TrustedDeviceService } from './trusted-device.service'
import { AuthService } from '../auth.service'
import {
  generateDeviceFingerprint,
  formatLocation,
  formatDevice,
} from '@/utils/fingerprint'
import { generateVerificationCode, pickPrimaryMembership } from '@/utils/auth'
import { Prisma } from '@rufieltics/db'
import {
  AUTH_EVENTS,
  LoginSuccessEvent,
  LoginFailedEvent,
  StepUpVerifiedEvent,
  StepUpBlockedEvent,
  RecoveryCodeUsedEvent,
} from '../events'
import type { LoginDto } from '../dto/login.dto'

export type StepUpMethod = 'email' | 'totp' | 'recovery'

interface StepUpChallenge {
  userId: number
  email: string
  isStaff: boolean
  role: string | null
  orgId: string | null
  code: string | null
  method: StepUpMethod
  userAgent: string | null
  ipAddress: string | null
}

@Injectable()
export class LoginService {
  private readonly STEP_UP_CODE_TTL_SECONDS: number
  private readonly STEP_UP_MAX_ATTEMPTS: number
  private readonly STEP_UP_CHALLENGE_TTL_SECONDS: number

  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly anomaly: LoginAnomalyService,
    private readonly mailQueue: MailQueueService,
    private readonly totpService: TotpService,
    private readonly mfaService: MfaService,
    private readonly trustedDevices: TrustedDeviceService,
    config: ConfigService
  ) {
    this.STEP_UP_CODE_TTL_SECONDS = config.get<number>(
      'security.stepUp.codeTtlSeconds',
      300
    )
    this.STEP_UP_MAX_ATTEMPTS = config.get<number>(
      'security.stepUp.maxAttempts',
      5
    )
    this.STEP_UP_CHALLENGE_TTL_SECONDS = config.get<number>(
      'security.stepUp.challengeTtlSeconds',
      600
    )
  }

  private dummyPasswordHash: string | null = null

  /**
   * A throwaway argon2 hash used to verify against when no user is found, so a
   * login attempt for a non-existent email costs the same time as one for a
   * real account — closing the timing side-channel that would otherwise reveal
   * whether an email is registered. Computed once and cached.
   */
  private async getDummyPasswordHash(): Promise<string> {
    if (!this.dummyPasswordHash) {
      this.dummyPasswordHash = await argon2.hash(
        randomBytes(32).toString('hex')
      )
    }
    return this.dummyPasswordHash
  }

  async login(
    data: LoginDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string,
    trustedDeviceToken?: string
  ) {
    const user = await getUserByEmail(data.email)

    // Always run a hash verification (against a dummy hash when the user is
    // missing) so response time doesn't reveal whether the email exists, and
    // return one generic message for both "no such email" and "wrong password".
    const passwordHash =
      user?.passwordHash ?? (await this.getDummyPasswordHash())
    const isPasswordValid = await argon2.verify(passwordHash, data.password)

    if (!user || !isPasswordValid) {
      this.eventEmitter.emit(
        AUTH_EVENTS.LOGIN_FAILED,
        new LoginFailedEvent(
          user
            ? Prisma.LoginReason.INVALID_PASSWORD
            : Prisma.LoginReason.USER_NOT_FOUND,
          data.email,
          ipAddress || null,
          userAgent || null,
          user?.id ?? null
        )
      )
      throw new UnauthorizedException(i18n.t('auth.errors.invalid_credentials'))
    }

    if (!user.isActive) {
      this.eventEmitter.emit(
        AUTH_EVENTS.LOGIN_FAILED,
        new LoginFailedEvent(
          Prisma.LoginReason.EMAIL_NOT_VERIFIED,
          data.email,
          ipAddress || null,
          userAgent || null,
          user.id
        )
      )
      throw new UnauthorizedException(
        i18n.t('auth.errors.account_not_verified')
      )
    }

    const memberships = await OrganizationMembers.listByUser(user.id)
    const primary = pickPrimaryMembership(memberships)

    const role = primary?.role ?? null
    const orgId = primary?.organizationId ?? null

    const { hash: fingerprint, geo: previewGeo } = generateDeviceFingerprint(
      user.id,
      userAgent,
      ipAddress
    )
    const trusted = await this.trustedDevices.verify(
      user.id,
      trustedDeviceToken,
      fingerprint
    )
    const risk = await this.anomaly.previewSuccessRisk({
      userId: user.id,
      deviceFingerprint: fingerprint,
      country: previewGeo.country,
      latitude: previewGeo.latitude,
      longitude: previewGeo.longitude,
    })

    const hasTotp = (await Totp.findConfirmed(user.id)) !== null

    if (this.shouldChallenge(hasTotp, trusted, risk)) {
      return this.initiateStepUp(
        user,
        role,
        orgId,
        i18n.lang,
        hasTotp,
        userAgent,
        ipAddress
      )
    }

    const { geo, deviceFingerprint, ...session } =
      await this.authService.initiateSession(
        user,
        role,
        orgId,
        userAgent,
        ipAddress
      )

    await Sessions.deleteExpiredByUserId(user.id)

    this.eventEmitter.emit(
      AUTH_EVENTS.LOGIN_SUCCESS,
      new LoginSuccessEvent(
        user.id,
        ipAddress || null,
        userAgent || null,
        deviceFingerprint,
        geo
      )
    )

    return session
  }

  private shouldChallenge(
    hasTotp: boolean,
    trusted: boolean,
    risk: RiskSignal[]
  ): boolean {
    if (risk.includes(RiskSignal.IMPOSSIBLE_TRAVEL)) return true
    if (trusted) return false
    if (hasTotp) return true

    return risk.length > 0
  }

  private stepUpUserKey(userId: number): string {
    return `stepup:user:${userId}`
  }

  private async voidStepUpChallenge(
    challengeId: string,
    userId: number
  ): Promise<void> {
    await Promise.all([
      this.redisService.deleteStepUpChallenge(challengeId),
      this.redisService.del(this.stepUpUserKey(userId)),
    ])
  }

  /**
   * Voids a challenge whose OTP attempts were exhausted, notifies the account
   * owner that a password-correct sign-in was blocked, and throws. Someone had
   * the password but couldn't pass the second factor.
   */
  private async failStepUp(
    challengeId: string,
    challenge: StepUpChallenge,
    i18n: I18nContext
  ): Promise<never> {
    await this.voidStepUpChallenge(challengeId, challenge.userId)

    const { geo } = generateDeviceFingerprint(
      challenge.userId,
      challenge.userAgent ?? undefined,
      challenge.ipAddress ?? undefined
    )
    this.eventEmitter.emit(
      AUTH_EVENTS.STEP_UP_BLOCKED,
      new StepUpBlockedEvent(
        challenge.userId,
        challenge.ipAddress,
        formatLocation(geo),
        formatDevice(challenge.userAgent)
      )
    )

    throw new UnauthorizedException(
      i18n.t('auth.errors.step_up_too_many_attempts')
    )
  }

  private async initiateStepUp(
    user: { id: number; email: string; name: string; isStaff: boolean },
    role: string | null,
    orgId: string | null,
    locale: string,
    hasTotp: boolean,
    userAgent?: string,
    ipAddress?: string
  ) {
    const method: StepUpMethod = hasTotp ? 'totp' : 'email'
    const availableMethods = hasTotp ? ['totp', 'recovery'] : ['email']

    const userKey = this.stepUpUserKey(user.id)
    if (method === 'email') {
      const activeChallengeId = await this.redisService.get<string>(userKey)
      if (activeChallengeId) {
        const active =
          await this.redisService.getStepUpChallenge(activeChallengeId)
        if (active) {
          return {
            stepUpRequired: true as const,
            challengeId: activeChallengeId,
            method,
            availableMethods,
          }
        }
      }
    }

    const challengeId = randomUUID()
    const code = method === 'email' ? generateVerificationCode() : null

    const challenge: StepUpChallenge = {
      userId: user.id,
      email: user.email,
      isStaff: user.isStaff,
      role,
      orgId,
      code,
      method,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    }

    await this.redisService.setStepUpChallenge(
      challengeId,
      challenge,
      this.STEP_UP_CHALLENGE_TTL_SECONDS
    )

    if (method === 'email') {
      await this.redisService.set(
        userKey,
        challengeId,
        this.STEP_UP_CHALLENGE_TTL_SECONDS
      )
    }

    // Enqueue (HIGH priority) rather than sending inline: the login request
    // must not block on the mail provider. The code is delivered by the mail
    // worker within seconds, well inside its TTL.
    if (code) {
      const message = await renderEmail('step-up-otp', locale, {
        name: user.name,
        code,
        minutes: Math.round(this.STEP_UP_CODE_TTL_SECONDS / 60),
      })
      await this.mailQueue.enqueue(
        { to: user.email, ...message },
        { priority: MailPriority.HIGH }
      )
    }

    return {
      stepUpRequired: true as const,
      challengeId,
      method,
      availableMethods,
    }
  }

  private async verifyStepUpFactor(
    challenge: StepUpChallenge,
    method: StepUpMethod,
    code: string
  ): Promise<boolean> {
    if (method === 'email') {
      return challenge.method === 'email' && challenge.code === code
    }

    if (challenge.method !== 'totp') return false

    if (method === 'recovery') {
      return this.mfaService.consumeRecoveryCode(challenge.userId, code)
    }

    const record = await Totp.findConfirmed(challenge.userId)
    if (!record) return false

    const secret = this.totpService.decryptSecret(record.secret)
    const ok = await this.totpService.verifyAndConsume(
      challenge.userId,
      secret,
      code
    )
    if (ok) await Totp.touchLastUsed(challenge.userId)
    return ok
  }

  /**
   * Completes a step-up challenge: validates the submitted factor and, on
   * success, issues the session. The resulting login is marked step-up-verified
   * so the audit listener records the device without a redundant alert.
   */
  async verifyStepUp(
    challengeId: string,
    code: string,
    method: StepUpMethod,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string,
    trustDevice = false
  ) {
    const challenge =
      await this.redisService.getStepUpChallenge<StepUpChallenge>(challengeId)
    if (!challenge) {
      throw new UnauthorizedException(i18n.t('auth.errors.step_up_expired'))
    }

    const usedMethod = method
    const allowedMethods: StepUpMethod[] =
      challenge.method === 'email' ? ['email'] : ['totp', 'recovery']
    if (!allowedMethods.includes(usedMethod)) {
      throw new BadRequestException(
        i18n.t(
          challenge.method === 'totp'
            ? 'auth.errors.step_up_expects_totp'
            : 'auth.errors.step_up_expects_email'
        )
      )
    }

    const attempts =
      await this.redisService.incrementStepUpAttempts(challengeId)
    if (attempts > this.STEP_UP_MAX_ATTEMPTS) {
      await this.failStepUp(challengeId, challenge, i18n)
    }
    const passed = await this.verifyStepUpFactor(challenge, usedMethod, code)

    if (!passed) {
      const remaining = this.STEP_UP_MAX_ATTEMPTS - attempts
      if (remaining <= 0) {
        await this.failStepUp(challengeId, challenge, i18n)
      }
      throw new UnauthorizedException(
        i18n.t('auth.errors.step_up_invalid_code', {
          args: { attempts: remaining },
        })
      )
    }

    await this.voidStepUpChallenge(challengeId, challenge.userId)

    if (usedMethod === 'recovery') {
      this.eventEmitter.emit(
        AUTH_EVENTS.RECOVERY_CODE_USED,
        new RecoveryCodeUsedEvent(
          challenge.userId,
          challenge.ipAddress,
          await RecoveryCodes.countUnused(challenge.userId)
        )
      )
    }

    // Issue the session for the device that was challenged at login.
    const sessionUserAgent = challenge.userAgent ?? userAgent
    const sessionIpAddress = challenge.ipAddress ?? ipAddress

    const { geo, deviceFingerprint, ...session } =
      await this.authService.initiateSession(
        {
          id: challenge.userId,
          email: challenge.email,
          isStaff: challenge.isStaff,
        },
        challenge.role,
        challenge.orgId,
        sessionUserAgent,
        sessionIpAddress
      )

    await Sessions.deleteExpiredByUserId(challenge.userId)

    this.eventEmitter.emit(
      AUTH_EVENTS.LOGIN_SUCCESS,
      new LoginSuccessEvent(
        challenge.userId,
        sessionIpAddress || null,
        sessionUserAgent || null,
        deviceFingerprint,
        geo,
        true
      )
    )

    this.eventEmitter.emit(
      AUTH_EVENTS.STEP_UP_VERIFIED,
      new StepUpVerifiedEvent(
        challenge.userId,
        sessionIpAddress || null,
        formatLocation(geo),
        formatDevice(sessionUserAgent)
      )
    )

    const trustedDevice = trustDevice
      ? await this.trustedDevices.issue(
          challenge.userId,
          sessionUserAgent ?? null,
          sessionIpAddress ?? null
        )
      : null

    return {
      ...session,
      trustedDeviceToken: trustedDevice?.token ?? null,
      trustedDeviceTtl: trustedDevice?.ttlSeconds ?? 0,
    }
  }
}
