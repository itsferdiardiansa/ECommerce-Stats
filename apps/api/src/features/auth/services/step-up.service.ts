import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { randomUUID } from 'crypto'
import { Totp, RecoveryCodes } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { StepUpStore } from '@/modules/redis/stores'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import { MailPriority } from '@/modules/mail/mail.constants'
import { renderEmail } from '@rufieltics/emails'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { TotpService } from './totp.service'
import { MfaService } from './mfa.service'
import { PasskeyService } from './passkey.service'
import { TrustedDeviceService } from './trusted-device.service'
import { AuthService } from '../auth.service'
import {
  generateDeviceFingerprint,
  formatLocation,
  formatDevice,
} from '@/utils/fingerprint'
import { generateVerificationCode } from '@/utils/auth'
import {
  AUTH_EVENTS,
  LoginSuccessEvent,
  StepUpVerifiedEvent,
  StepUpBlockedEvent,
  RecoveryCodeUsedEvent,
} from '../events'

export type StepUpMethod = 'email' | 'totp' | 'recovery' | 'passkey'

interface StepUpChallenge {
  userId: number
  email: string
  isStaff: boolean
  role: string | null
  orgId: string | null
  code: string | null
  method: StepUpMethod
  availableMethods: StepUpMethod[]
  userAgent: string | null
  ipAddress: string | null
}

/**
 * Owns the second-factor / passkey flows that complete a login: the email/TOTP/
 * recovery step-up challenge, passkey step-up, and passwordless (discoverable)
 * passkey login. LoginService handles the password step and delegates here.
 */
@Injectable()
export class StepUpService {
  private readonly STEP_UP_CODE_TTL_SECONDS: number
  private readonly STEP_UP_MAX_ATTEMPTS: number
  private readonly STEP_UP_CHALLENGE_TTL_SECONDS: number
  private readonly STEP_UP_MAX_USER_FAILURES: number
  private readonly STEP_UP_LOCKOUT_SECONDS: number
  private readonly STEP_UP_LOCKOUT_LADDER: number[]
  private readonly STEP_UP_LOCK_LEVEL_TTL: number

  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly stepUpStore: StepUpStore,
    private readonly eventEmitter: EventEmitter2,
    private readonly mailQueue: MailQueueService,
    private readonly totpService: TotpService,
    private readonly mfaService: MfaService,
    private readonly passkeyService: PasskeyService,
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
    this.STEP_UP_MAX_USER_FAILURES = config.get<number>(
      'security.stepUp.maxUserFailures',
      10
    )
    this.STEP_UP_LOCKOUT_SECONDS = config.get<number>(
      'security.stepUp.lockoutSeconds',
      900
    )
    this.STEP_UP_LOCKOUT_LADDER = config.get<number[]>(
      'security.stepUp.lockoutLadderSeconds',
      [900, 3600, 21600, 86400]
    )
    this.STEP_UP_LOCK_LEVEL_TTL = config.get<number>(
      'security.stepUp.lockLevelTtlSeconds',
      86400
    )
  }

  private stepUpUserKey(userId: number): string {
    return `stepup:user:${userId}`
  }

  private async voidStepUpChallenge(
    challengeId: string,
    userId: number
  ): Promise<void> {
    await Promise.all([
      this.stepUpStore.deleteChallenge(challengeId),
      this.redisService.del(this.stepUpUserKey(userId)),
    ])
  }

  private emitStepUpBlocked(challenge: StepUpChallenge): void {
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
  }

  /** Voids an attempts-exhausted challenge, alerts the owner, and throws. */
  private async failStepUp(
    challengeId: string,
    challenge: StepUpChallenge,
    i18n: I18nContext
  ): Promise<never> {
    await this.voidStepUpChallenge(challengeId, challenge.userId)
    this.emitStepUpBlocked(challenge)
    throw new UnauthorizedException(
      i18n.t('auth.errors.step_up_too_many_attempts')
    )
  }

  /** Escalating lockout: each successive lock lasts longer. Returns seconds. */
  private async escalateLock(userId: number): Promise<number> {
    const level = await this.stepUpStore.incrementLockLevel(
      userId,
      this.STEP_UP_LOCK_LEVEL_TTL
    )
    const idx = Math.min(level - 1, this.STEP_UP_LOCKOUT_LADDER.length - 1)
    const seconds = this.STEP_UP_LOCKOUT_LADDER[idx]
    await this.stepUpStore.lock(userId, seconds)
    await this.stepUpStore.resetUserFailures(userId)
    return seconds
  }

  /** Rounded retry time; the escalation level is never exposed. */
  private stepUpLockedException(
    seconds: number,
    i18n: I18nContext
  ): UnauthorizedException {
    if (seconds >= 3600) {
      const hours = Math.max(1, Math.round(seconds / 3600))
      return new UnauthorizedException(
        i18n.t('auth.errors.step_up_locked_hours', { args: { hours } })
      )
    }
    const minutes = Math.max(1, Math.round(seconds / 60))
    return new UnauthorizedException(
      i18n.t('auth.errors.step_up_locked_minutes', { args: { minutes } })
    )
  }

  async initiateStepUp(
    user: { id: number; email: string; name: string; isStaff: boolean },
    role: string | null,
    orgId: string | null,
    locale: string,
    hasTotp: boolean,
    hasPasskey: boolean,
    userAgent?: string,
    ipAddress?: string
  ) {
    // Prefer the strongest factor available: passkey > totp > email.
    const availableMethods: StepUpMethod[] = []
    if (hasPasskey) availableMethods.push('passkey')
    if (hasTotp) availableMethods.push('totp', 'recovery')
    if (availableMethods.length === 0) availableMethods.push('email')
    const method = availableMethods[0]

    const userKey = this.stepUpUserKey(user.id)
    if (method === 'email') {
      const activeChallengeId = await this.redisService.get<string>(userKey)
      if (activeChallengeId) {
        const active = await this.stepUpStore.getChallenge(activeChallengeId)
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
      availableMethods,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    }

    await this.stepUpStore.setChallenge(
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

    // Enqueue rather than send inline so login never blocks on the mail provider.
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

  /** Validates the submitted factor and, on success, issues the session. */
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
      await this.stepUpStore.getChallenge<StepUpChallenge>(challengeId)
    if (!challenge) {
      throw new UnauthorizedException(i18n.t('auth.errors.step_up_expired'))
    }

    const usedMethod = method
    // Passkey is answered through its own /login/passkey/verify route, so it is
    // not a code-based method here.
    const allowedMethods: StepUpMethod[] = challenge.availableMethods.filter(
      m => m !== 'passkey'
    )
    if (!allowedMethods.includes(usedMethod)) {
      throw new BadRequestException(i18n.t(this.stepUpExpectsKey(challenge)))
    }

    const lockRemaining = await this.stepUpStore.getLockRemaining(
      challenge.userId
    )
    if (lockRemaining > 0) {
      throw this.stepUpLockedException(lockRemaining, i18n)
    }

    const attempts = await this.stepUpStore.incrementAttempts(challengeId)
    if (attempts > this.STEP_UP_MAX_ATTEMPTS) {
      await this.failStepUp(challengeId, challenge, i18n)
    }
    const passed = await this.verifyStepUpFactor(challenge, usedMethod, code)

    if (!passed) {
      const cumulative = await this.stepUpStore.incrementUserFailures(
        challenge.userId,
        this.STEP_UP_LOCKOUT_SECONDS
      )
      if (cumulative >= this.STEP_UP_MAX_USER_FAILURES) {
        const seconds = await this.escalateLock(challenge.userId)
        await this.voidStepUpChallenge(challengeId, challenge.userId)
        this.emitStepUpBlocked(challenge)
        throw this.stepUpLockedException(seconds, i18n)
      }
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
    await this.stepUpStore.resetUserFailures(challenge.userId)

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

    return this.completeStepUp(challenge, ipAddress, userAgent, trustDevice)
  }

  /** Issues assertion options for a passkey step-up already under way. */
  async initiatePasskeyLoginOptions(challengeId: string, i18n: I18nContext) {
    const challenge =
      await this.stepUpStore.getChallenge<StepUpChallenge>(challengeId)
    if (!challenge) {
      throw new UnauthorizedException(i18n.t('auth.errors.step_up_expired'))
    }
    if (!challenge.availableMethods.includes('passkey')) {
      throw new BadRequestException(i18n.t(this.stepUpExpectsKey(challenge)))
    }
    return this.passkeyService.beginAuthentication(
      'login',
      challengeId,
      challenge.userId
    )
  }

  /** Completes a passkey step-up: verifies the assertion, then issues a session. */
  async verifyPasskeyLogin(
    challengeId: string,
    response: AuthenticationResponseJSON,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string,
    trustDevice = false
  ) {
    const challenge =
      await this.stepUpStore.getChallenge<StepUpChallenge>(challengeId)
    if (!challenge) {
      throw new UnauthorizedException(i18n.t('auth.errors.step_up_expired'))
    }
    if (!challenge.availableMethods.includes('passkey')) {
      throw new BadRequestException(i18n.t(this.stepUpExpectsKey(challenge)))
    }

    const lockRemaining = await this.stepUpStore.getLockRemaining(
      challenge.userId
    )
    if (lockRemaining > 0) {
      throw this.stepUpLockedException(lockRemaining, i18n)
    }

    const verifiedUserId = await this.passkeyService.finishAuthentication(
      'login',
      challengeId,
      response
    )

    if (verifiedUserId !== challenge.userId) {
      const cumulative = await this.stepUpStore.incrementUserFailures(
        challenge.userId,
        this.STEP_UP_LOCKOUT_SECONDS
      )
      if (cumulative >= this.STEP_UP_MAX_USER_FAILURES) {
        const seconds = await this.escalateLock(challenge.userId)
        await this.voidStepUpChallenge(challengeId, challenge.userId)
        this.emitStepUpBlocked(challenge)
        throw this.stepUpLockedException(seconds, i18n)
      }
      throw new UnauthorizedException(
        i18n.t('auth.errors.step_up_invalid_passkey')
      )
    }

    await this.voidStepUpChallenge(challengeId, challenge.userId)
    await this.stepUpStore.resetUserFailures(challenge.userId)

    return this.completeStepUp(challenge, ipAddress, userAgent, trustDevice)
  }

  private stepUpExpectsKey(challenge: StepUpChallenge): string {
    if (challenge.availableMethods.includes('passkey')) {
      return 'auth.errors.step_up_expects_passkey'
    }
    if (challenge.availableMethods.includes('totp')) {
      return 'auth.errors.step_up_expects_totp'
    }
    return 'auth.errors.step_up_expects_email'
  }

  /** Shared tail: issue the session for the challenged device and fire events. */
  private async completeStepUp(
    challenge: StepUpChallenge,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    trustDevice: boolean
  ) {
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
