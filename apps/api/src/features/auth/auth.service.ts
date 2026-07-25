import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as argon2 from 'argon2'
import { createHash, randomBytes, randomUUID } from 'crypto'
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  getUserByEmailIncludingDeleted,
  getUserByUsernameIncludingDeleted,
  getUserCredentials,
} from '@rufieltics/db/domains/identity/user'
import {
  Organizations,
  OrganizationMembers,
} from '@rufieltics/db/domains/identity/organization'
import {
  Sessions,
  TrustedDevices,
  PasswordSecurity,
  Totp,
  RecoveryCodes,
} from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { JwtService } from '@/modules/jwt/jwt.service'
import { TokenDenylistService } from '@/modules/jwt/token-denylist.service'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import { MailPriority } from '@/modules/mail/mail.constants'
import { renderEmail } from '@rufieltics/emails'
import {
  LoginAnomalyService,
  RiskSignal,
} from './services/login-anomaly.service'
import { TotpService } from './services/totp.service'
import { MfaService } from './services/mfa.service'
import { TrustedDeviceService } from './services/trusted-device.service'
import type { AccessTokenPayload } from '@/modules/jwt/jwt.service'
import type { RegisterDto } from './dto/register.dto'
import type { VerifyEmailDto } from './dto/verify-email.dto'
import type { ResendVerificationDto } from './dto/resend-verification.dto'
import type { LoginDto } from './dto/login.dto'
import type { RefreshTokenDto } from './dto/refresh-token.dto'
import { formatRemainingTime } from '@/utils/datetime'
import {
  generateDeviceFingerprint,
  formatLocation,
  formatDevice,
} from '@/utils/fingerprint'
import {
  generateVerificationCode,
  generateOrgSlug,
  pickPrimaryMembership,
} from '@/utils/auth'
import { Prisma } from '@rufieltics/db'
import {
  AUTH_EVENTS,
  LoginSuccessEvent,
  LoginFailedEvent,
  SecurityCompromiseEvent,
  StepUpVerifiedEvent,
  StepUpBlockedEvent,
  PasswordChangedEvent,
  RecoveryCodeUsedEvent,
} from './events'

interface StoredSession {
  userId: number
  refreshTokenHash: string
  isRevoked: boolean
  expires: string
  role: string | null
  orgId: string | null
  deviceFingerprint: string
}

export type StepUpMethod = 'email' | 'totp' | 'recovery'

interface StepUpChallenge {
  userId: number
  email: string
  isStaff: boolean
  role: string | null
  orgId: string | null
  code: string | null
  method: StepUpMethod
  // The device that initiated (and was risk-assessed at) login. The session is
  // issued for THIS device on success, so passing the OTP trusts exactly the
  // device that was challenged — not whichever client submitted the code.
  userAgent: string | null
  ipAddress: string | null
}

@Injectable()
export class AuthService {
  private readonly VERIFICATION_CODE_TTL_SECONDS: number
  private readonly VERIFICATION_CODE_MAX_AGE_MS: number
  private readonly VERIFICATION_MAX_ATTEMPTS: number
  private readonly VERIFICATION_LOCKOUT_DURATION_SECONDS: number
  private readonly STEP_UP_CODE_TTL_SECONDS: number
  private readonly STEP_UP_MAX_ATTEMPTS: number
  private readonly STEP_UP_CHALLENGE_TTL_SECONDS: number

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenDenylist: TokenDenylistService,
    private readonly anomaly: LoginAnomalyService,
    private readonly mailQueue: MailQueueService,
    private readonly totpService: TotpService,
    private readonly mfaService: MfaService,
    private readonly trustedDevices: TrustedDeviceService,
    config: ConfigService
  ) {
    this.VERIFICATION_CODE_TTL_SECONDS = config.get<number>(
      'security.verification.codeTtlSeconds',
      300
    )
    this.VERIFICATION_CODE_MAX_AGE_MS =
      this.VERIFICATION_CODE_TTL_SECONDS * 1000
    this.VERIFICATION_MAX_ATTEMPTS = config.get<number>(
      'security.verification.maxAttempts',
      5
    )
    this.VERIFICATION_LOCKOUT_DURATION_SECONDS = config.get<number>(
      'security.verification.lockoutSeconds',
      3600
    )
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

  /**
   * Single source of truth for the "account is locked out" message so that
   * every endpoint (register, verify-email, resend-verification, …) reports an
   * identical, consistent response for a lockout.
   */
  private lockoutException(
    ttlSeconds: number,
    i18n: I18nContext
  ): BadRequestException {
    const { minutes, seconds } = formatRemainingTime(ttlSeconds * 1000)
    const messageKey =
      minutes > 0
        ? 'auth.errors.account_locked'
        : 'auth.errors.account_locked_seconds'
    const args = minutes > 0 ? { minutes, seconds } : { seconds }
    return new BadRequestException(i18n.t(messageKey, { args }))
  }

  /** Throws the consistent lockout response when a lockout is active. */
  private assertNotLockedOut(
    lockout: { ttl: number } | null,
    i18n: I18nContext
  ): void {
    if (!lockout) return
    throw this.lockoutException(lockout.ttl, i18n)
  }

  /**
   * Arms a verification lockout (persisting it + clearing the active code) and
   * throws the same lockout response every other endpoint returns, so the
   * moment of lockout and every subsequent call read identically.
   */
  private async triggerVerificationLockout(
    email: string,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<never> {
    await this.redisService.setVerificationLockout(
      email,
      this.VERIFICATION_LOCKOUT_DURATION_SECONDS,
      'TOO_MANY_ATTEMPTS',
      ipAddress,
      userAgent
    )
    await this.redisService.deleteVerificationCode(email)
    throw this.lockoutException(
      this.VERIFICATION_LOCKOUT_DURATION_SECONDS,
      i18n
    )
  }

  /** Renders and queues the email-verification code (register + resend). */
  private async sendVerificationEmail(
    to: string,
    name: string,
    code: string,
    i18n: I18nContext
  ): Promise<void> {
    const message = await renderEmail('verification-code', i18n.lang, {
      name,
      code,
      minutes: Math.round(this.VERIFICATION_CODE_TTL_SECONDS / 60),
    })
    await this.mailQueue.enqueue(
      { to, ...message },
      { priority: MailPriority.HIGH }
    )
  }

  async register(data: RegisterDto, i18n: I18nContext) {
    try {
      const { password, ...rest } = data
      const { email, username } = data

      const existingUserByEmail = await getUserByEmailIncludingDeleted(email)
      if (existingUserByEmail) {
        if (existingUserByEmail.deletedAt) {
          throw new BadRequestException(
            i18n.t('auth.errors.email_already_exists_deleted')
          )
        }

        const fullUser = await getUserByEmail(email)
        if (fullUser && !fullUser.isActive && !fullUser.emailVerifiedAt) {
          const lockout = await this.redisService.getVerificationLockout(email)
          this.assertNotLockedOut(lockout, i18n)
        }

        throw new BadRequestException(
          i18n.t('auth.errors.email_already_exists')
        )
      }

      const existingUserByUsername =
        await getUserByUsernameIncludingDeleted(username)
      if (existingUserByUsername) {
        if (existingUserByUsername.deletedAt) {
          throw new BadRequestException(
            i18n.t('auth.errors.username_already_exists_deleted')
          )
        }
        throw new BadRequestException(
          i18n.t('auth.errors.username_already_exists')
        )
      }

      const passwordHash = await argon2.hash(password)

      const user = await createUser({
        ...rest,
        passwordHash,
        isActive: false,
      })

      const code = generateVerificationCode()
      await this.redisService.setVerificationCode(
        email,
        code,
        this.VERIFICATION_CODE_TTL_SECONDS
      )

      await this.sendVerificationEmail(email, user.name, code, i18n)

      return user
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err
      }
      throw new BadRequestException((err as Error).message)
    }
  }

  async verifyEmail(
    data: VerifyEmailDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { email, code } = data

    const user = await getUserByEmail(email)
    if (!user) {
      throw new NotFoundException(i18n.t('auth.errors.user_not_found'))
    }

    if (user.isActive && user.emailVerifiedAt) {
      throw new BadRequestException(i18n.t('auth.errors.already_verified'))
    }

    const lockout = await this.redisService.getVerificationLockout(email)
    this.assertNotLockedOut(lockout, i18n)

    const storedData = await this.redisService.getVerificationCode(email)

    if (!storedData) {
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    const codeAge = Date.now() - new Date(storedData.createdAt).getTime()

    if (codeAge > this.VERIFICATION_CODE_MAX_AGE_MS) {
      await this.redisService.deleteVerificationCode(email)
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    // Atomically consume an attempt *before* comparing the code so the cap
    // holds under concurrent requests (INCR can't be raced like a read-modify
    // -write). The (MAX+1)th attempt is rejected before any comparison.
    const attemptNo =
      await this.redisService.incrementVerificationAttempts(email)

    if (attemptNo > this.VERIFICATION_MAX_ATTEMPTS) {
      await this.triggerVerificationLockout(email, i18n, ipAddress, userAgent)
    }

    if (storedData.code !== code) {
      const remaining = this.VERIFICATION_MAX_ATTEMPTS - attemptNo

      if (remaining <= 0) {
        await this.triggerVerificationLockout(email, i18n, ipAddress, userAgent)
      }

      const messageKey =
        remaining === 1
          ? 'auth.errors.invalid_code_last_attempt'
          : 'auth.errors.invalid_code'
      throw new BadRequestException(
        i18n.t(messageKey, { args: { attempts: remaining } })
      )
    }

    const [updatedUser] = await Promise.all([
      updateUser(user.id, {
        isActive: true,
        emailVerifiedAt: new Date(),
      }),
      this.redisService.deleteVerificationCode(email),
      this.provisionPersonalWorkspace(user.id, user.name, user.username),
    ])

    return updatedUser
  }

  private async provisionPersonalWorkspace(
    userId: number,
    name: string,
    username: string
  ) {
    const existing = await OrganizationMembers.listByUser(userId)
    if (existing.length > 0) return

    const org = await Organizations.create({
      name: `${name}'s Workspace`,
      slug: generateOrgSlug(username),
    })

    await OrganizationMembers.addMember({
      organizationId: org.id,
      userId,
      role: 'OWNER',
    })
  }

  private async initiateSession(
    user: {
      id: number
      email: string
      isStaff: boolean
    },
    role: string | null,
    orgId: string | null,
    userAgent?: string,
    ipAddress?: string
  ) {
    const jti = randomUUID()
    const refreshTtl = this.jwtService.getRefreshExpiresIn()
    const expires = new Date(Date.now() + refreshTtl * 1000)
    const rawDeviceSecret = randomBytes(32).toString('hex')
    const deviceSecretHash = createHash('sha256')
      .update(rawDeviceSecret)
      .digest('hex')

    const { hash: deviceFingerprint, geo } = generateDeviceFingerprint(
      user.id,
      userAgent,
      ipAddress
    )

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      isStaff: user.isStaff,
      role,
      orgId,
      jti,
      fph: deviceSecretHash,
      env: deviceFingerprint,
    }

    const accessToken = this.jwtService.signAccessToken(accessPayload)
    const refreshToken = this.jwtService.signRefreshToken(jti)
    const refreshTokenHash = await argon2.hash(refreshToken)

    const existingSession = await Sessions.findByFingerprint(
      user.id,
      deviceFingerprint
    )

    if (existingSession && existingSession.jti !== jti) {
      await this.redisService.deleteSession(existingSession.jti)
    }

    await Promise.all([
      Sessions.upsertByFingerprint({
        userId: user.id,
        jti,
        refreshTokenHash,
        orgId,
        role,
        ipAddress,
        userAgent,
        deviceFingerprint,
        expires,
      }),
      this.redisService.setSession(
        jti,
        {
          userId: user.id,
          refreshTokenHash,
          isRevoked: false,
          expires: expires.toISOString(),
          role,
          orgId,
          deviceFingerprint,
        },
        refreshTtl
      ),
    ])

    return {
      accessToken,
      refreshToken,
      rawDeviceSecret,
      expiresIn: this.jwtService.getAccessExpiresIn(),
      deviceFingerprint,
      geo,
    }
  }

  async resendVerification(data: ResendVerificationDto, i18n: I18nContext) {
    const { email } = data

    const user = await getUserByEmail(email)
    if (!user) {
      throw new NotFoundException(i18n.t('auth.errors.user_not_found'))
    }

    if (user.isActive && user.emailVerifiedAt) {
      throw new BadRequestException(i18n.t('auth.errors.already_verified'))
    }

    const lockout = await this.redisService.getVerificationLockout(email)
    this.assertNotLockedOut(lockout, i18n)

    const existingCode = await this.redisService.getVerificationCode(email)

    if (existingCode) {
      const codeAge = Date.now() - new Date(existingCode.createdAt).getTime()

      if (codeAge < this.VERIFICATION_CODE_MAX_AGE_MS) {
        const remainingTime = this.VERIFICATION_CODE_MAX_AGE_MS - codeAge
        const { minutes, seconds } = formatRemainingTime(remainingTime)
        const messageKey =
          minutes > 0
            ? 'auth.errors.code_still_valid'
            : 'auth.errors.code_still_valid_seconds'
        const args = minutes > 0 ? { minutes, seconds } : { seconds }
        throw new BadRequestException(i18n.t(messageKey, { args }))
      }
    }

    const code = generateVerificationCode()
    await this.redisService.setVerificationCode(
      email,
      code,
      this.VERIFICATION_CODE_TTL_SECONDS
    )

    await this.sendVerificationEmail(email, user.name, code, i18n)

    return {
      message: i18n.t('auth.resend.success'),
    }
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

    const { geo, deviceFingerprint, ...session } = await this.initiateSession(
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

  /**
   * Starts an email-OTP step-up: generates a code, stashes the pending login
   * context in Redis, and emails the code. No session is issued until the code
   * is verified via {@link verifyStepUp}.
   */
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

    const { geo, deviceFingerprint, ...session } = await this.initiateSession(
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

  async refreshToken(
    data: RefreshTokenDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { jti } = this.jwtService.verifyRefreshToken(data.refreshToken)

    const reusedSession = await this.redisService.get<{ userId: number }>(
      `revoked_jti:${jti}`
    )
    if (reusedSession) {
      await this.revokeAllSessions(reusedSession.userId)
      this.eventEmitter.emit(
        'auth.security.compromise',
        new SecurityCompromiseEvent(
          reusedSession.userId,
          ipAddress || null,
          userAgent || null
        )
      )
      throw new UnauthorizedException(
        i18n.t('auth.errors.reused_refresh_token')
      )
    }

    const sessionData = (await this.redisService.getSession(
      jti
    )) as StoredSession | null

    let storedHash: string
    let userId: number
    let role: string | null = null
    let orgId: string | null = null
    let storedFingerprint: string

    if (sessionData) {
      if (sessionData.isRevoked) {
        await this.revokeAllSessions(sessionData.userId)
        this.eventEmitter.emit(
          'auth.security.compromise',
          new SecurityCompromiseEvent(
            sessionData.userId,
            ipAddress || null,
            userAgent || null
          )
        )
        throw new UnauthorizedException(i18n.t('auth.errors.session_revoked'))
      }
      if (new Date(sessionData.expires) <= new Date()) {
        throw new UnauthorizedException(i18n.t('auth.errors.session_expired'))
      }
      storedHash = sessionData.refreshTokenHash
      userId = sessionData.userId
      role = sessionData.role
      orgId = sessionData.orgId
      storedFingerprint = sessionData.deviceFingerprint
    } else {
      const dbSession = await Sessions.findByJti(jti)
      if (!dbSession) {
        throw new UnauthorizedException(
          i18n.t('auth.errors.invalid_refresh_token')
        )
      }
      if (dbSession.isRevoked) {
        await this.revokeAllSessions(dbSession.userId)
        this.eventEmitter.emit(
          'auth.security.compromise',
          new SecurityCompromiseEvent(
            dbSession.userId,
            ipAddress || null,
            userAgent || null
          )
        )
        throw new UnauthorizedException(i18n.t('auth.errors.session_revoked'))
      }
      if (dbSession.expires <= new Date()) {
        throw new UnauthorizedException(i18n.t('auth.errors.session_expired'))
      }
      storedHash = dbSession.refreshTokenHash
      userId = dbSession.userId
      role = dbSession.role
      orgId = dbSession.orgId
      storedFingerprint = dbSession.deviceFingerprint
    }

    const isValid = await argon2.verify(storedHash, data.refreshToken)
    if (!isValid) {
      throw new UnauthorizedException(
        i18n.t('auth.errors.invalid_refresh_token')
      )
    }

    const { hash: currentFingerprint } = generateDeviceFingerprint(
      userId,
      userAgent,
      ipAddress
    )

    if (storedFingerprint && storedFingerprint !== currentFingerprint) {
      await Promise.all([
        this.redisService.deleteSession(jti),
        Sessions.revokeByJti(jti),
      ])
      throw new UnauthorizedException(i18n.t('auth.errors.invalid_client'))
    }

    await Promise.all([
      this.redisService.deleteSession(jti),
      Sessions.revokeByJti(jti),
      this.redisService.set(
        `revoked_jti:${jti}`,
        { userId },
        this.jwtService.getRefreshExpiresIn()
      ),
    ])

    const user = await getUserById(userId)
    if (!user) {
      throw new UnauthorizedException(i18n.t('auth.errors.user_not_found'))
    }

    const result = await this.initiateSession(
      user,
      role,
      orgId,
      userAgent,
      ipAddress
    )

    // geo/deviceFingerprint are internal to session creation; don't leak them
    // in the refresh response.
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      rawDeviceSecret: result.rawDeviceSecret,
      expiresIn: result.expiresIn,
    }
  }

  /** Sudo-guarded password change: rejects reuse and signs out other devices. */
  async changePassword(
    userId: number,
    currentJti: string,
    newPassword: string,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await getUserCredentials(userId)
    if (!user) {
      throw new NotFoundException(i18n.t('users.errors.user_not_found'))
    }

    if (await argon2.verify(user.passwordHash, newPassword)) {
      throw new BadRequestException(i18n.t('auth.errors.password_reused'))
    }

    const recent = await PasswordSecurity.getRecentPasswords(userId)
    for (const { password } of recent) {
      if (await argon2.verify(password, newPassword)) {
        throw new BadRequestException(i18n.t('auth.errors.password_reused'))
      }
    }

    await PasswordSecurity.archivePassword(userId, user.passwordHash)

    await updateUser(userId, {
      passwordHash: await argon2.hash(newPassword),
      passwordChangedAt: new Date(),
    })

    await this.revokeOtherSessions(userId, currentJti, i18n)
    await this.redisService.revokeSudo(currentJti)

    const { geo } = generateDeviceFingerprint(userId, userAgent, ipAddress)
    this.eventEmitter.emit(
      AUTH_EVENTS.PASSWORD_CHANGED,
      new PasswordChangedEvent(
        userId,
        ipAddress || null,
        formatLocation(geo),
        formatDevice(userAgent)
      )
    )

    return {
      message: i18n.t('auth.password.change_success'),
    }
  }

  async logout(jti: string) {
    const sessionData =
      ((await this.redisService.getSession(jti)) as StoredSession | null) ||
      (await Sessions.findByJti(jti))
    const userId = sessionData?.userId

    await this.tokenDenylist.deny(jti, this.jwtService.getAccessExpiresIn())

    await Promise.all([
      this.redisService.deleteSession(jti),
      Sessions.revokeByJti(jti),
      userId
        ? this.redisService.set(
            `revoked_jti:${jti}`,
            { userId },
            this.jwtService.getRefreshExpiresIn()
          )
        : Promise.resolve(),
    ])
  }

  async revokeOtherSessions(
    userId: number,
    currentJti: string,
    i18n: I18nContext
  ) {
    const activeSessions = await Sessions.findActiveByUserId(userId)
    const otherJtis = activeSessions
      .map(session => session.jti)
      .filter(jti => jti !== currentJti)

    if (!otherJtis.length) {
      return {
        message: i18n.t('auth.success.no_other_sessions', {
          defaultValue: 'No other active sessions found.',
        }),
      }
    }

    await this.tokenDenylist.denyMany(
      otherJtis,
      this.jwtService.getAccessExpiresIn()
    )

    await Promise.all(
      otherJtis.map(jti => this.redisService.deleteSession(jti))
    )

    await Sessions.revokeAllExceptJti(userId, currentJti)

    await this.trustedDevices.untrustByFingerprints(
      userId,
      activeSessions
        .filter(s => s.jti !== currentJti)
        .map(s => s.deviceFingerprint)
    )

    return {
      message: i18n.t('auth.success.sessions_revoked', {
        defaultValue: 'Successfully signed out of all other devices.',
      }),
    }
  }

  async getActiveSessions(
    userId: number,
    currentJti: string,
    i18n: I18nContext
  ) {
    const activeSessions = await Sessions.findActiveByUserId(userId)

    const formattedSessions = activeSessions.map(session => ({
      id: session.jti,
      isCurrent: session.jti === currentJti,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expires: session.expires,
    }))

    return {
      message: i18n.t('auth.success.sessions_retrieved', {
        defaultValue: 'Active sessions retrieved successfully.',
      }),
      data: formattedSessions,
    }
  }

  async revokeSessions(userId: number, jtis: string[], i18n: I18nContext) {
    if (!jtis || jtis.length === 0) {
      return {
        message: i18n.t('auth.success.no_sessions_provided', {
          defaultValue: 'No sessions provided for revocation.',
        }),
      }
    }

    const activeSessions = await Sessions.findActiveByUserId(userId)

    await this.tokenDenylist.denyMany(
      jtis,
      this.jwtService.getAccessExpiresIn()
    )

    await Promise.all(jtis.map(jti => this.redisService.deleteSession(jti)))

    await Sessions.revokeSessionsByJtis(userId, jtis)

    await this.trustedDevices.untrustByFingerprints(
      userId,
      activeSessions
        .filter(s => jtis.includes(s.jti))
        .map(s => s.deviceFingerprint)
    )

    return {
      message: i18n.t('auth.success.sessions_revoked', {
        defaultValue: 'Successfully signed out of selected devices.',
      }),
    }
  }

  private async revokeAllSessions(userId: number) {
    const activeSessions = await Sessions.findActiveByUserId(userId)
    const jtis = activeSessions.map(session => session.jti)

    if (jtis.length > 0) {
      await this.tokenDenylist.denyMany(
        jtis,
        this.jwtService.getAccessExpiresIn()
      )
      await Promise.all(jtis.map(jti => this.redisService.deleteSession(jti)))
    }

    await Sessions.revokeAllByUserId(userId)

    const revoked = await TrustedDevices.revokeAllByUser(userId)
    await Promise.all(
      revoked.map(r => this.redisService.evictTrustedDevice(r.tokenHash))
    )
  }
}
