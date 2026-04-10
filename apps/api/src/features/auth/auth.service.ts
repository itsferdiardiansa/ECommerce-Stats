import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as argon2 from 'argon2'
import {
  createUser,
  getUserByEmail,
  getUserForSession,
  updateUser,
  getUserByEmailIncludingDeleted,
  getUserByUsernameIncludingDeleted,
} from '@rufieltics/db/domains/identity/user'
import {
  Organizations,
  OrganizationMembers,
} from '@rufieltics/db/domains/identity/organization'
import { Sessions } from '@rufieltics/db/domains/auth'
import { JwtService } from '@/modules/jwt/jwt.service'
import { VerificationService } from './verification.service'
import { SessionService } from './session.service'
import type { RegisterDto } from './dto/register.dto'
import type { VerifyEmailDto } from './dto/verify-email.dto'
import type { ResendVerificationDto } from './dto/resend-verification.dto'
import type { LoginDto } from './dto/login.dto'
import type { RefreshTokenDto } from './dto/refresh-token.dto'
import { formatRemainingTime } from '@/utils/datetime'
import { generateDeviceFingerprint } from '@/utils/fingerprint'
import {
  generateVerificationCode,
  generateOrgSlug,
  pickPrimaryMembership,
} from '@/utils/auth'
import {
  LoginSuccessEvent,
  SecurityCompromiseEvent,
} from './listeners/auth-events.listener'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly verificationService: VerificationService,
    private readonly sessionService: SessionService
  ) {}

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
          const lockout =
            await this.verificationService.getVerificationLockout(email)
          if (lockout) {
            const remainingTime = lockout.ttl * 1000
            const { minutes, seconds } = formatRemainingTime(remainingTime)
            const messageKey =
              minutes > 0
                ? 'auth.errors.account_locked'
                : 'auth.errors.account_locked_seconds'
            const args = minutes > 0 ? { minutes, seconds } : { seconds }
            throw new BadRequestException(i18n.t(messageKey, { args }))
          }
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
      const user = await createUser({ ...rest, passwordHash, isActive: false })

      const code = generateVerificationCode()
      await this.verificationService.setVerificationCode(
        email,
        code,
        this.verificationService.VERIFICATION_CODE_TTL_SECONDS
      )

      return user
    } catch (err) {
      if (err instanceof BadRequestException) throw err
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

    const lockout = await this.verificationService.getVerificationLockout(email)
    if (lockout) {
      const remainingTime = lockout.ttl * 1000
      const { minutes, seconds } = formatRemainingTime(remainingTime)
      const messageKey =
        minutes > 0
          ? 'auth.errors.verification_locked'
          : 'auth.errors.verification_locked_seconds'
      const args = minutes > 0 ? { minutes, seconds } : { seconds }
      throw new BadRequestException(i18n.t(messageKey, { args }))
    }

    const storedData = await this.verificationService.getVerificationCode(email)

    if (!storedData) {
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    const codeAge = Date.now() - new Date(storedData.createdAt).getTime()

    if (codeAge > this.verificationService.VERIFICATION_CODE_MAX_AGE_MS) {
      await this.verificationService.deleteVerificationCode(email)
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    if (
      storedData.attempts >= this.verificationService.VERIFICATION_MAX_ATTEMPTS
    ) {
      await this.verificationService.setVerificationLockout(
        email,
        this.verificationService.VERIFICATION_LOCKOUT_DURATION_SECONDS,
        'TOO_MANY_ATTEMPTS',
        ipAddress,
        userAgent
      )
      await this.verificationService.deleteVerificationCode(email)
      throw new BadRequestException(
        i18n.t('auth.errors.too_many_verification_attempts')
      )
    }

    if (storedData.code !== code) {
      const newAttempts =
        await this.verificationService.incrementVerificationAttempts(email)
      const remaining =
        this.verificationService.VERIFICATION_MAX_ATTEMPTS - newAttempts

      if (remaining === 0) {
        throw new BadRequestException(
          i18n.t('auth.errors.too_many_verification_attempts')
        )
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
      updateUser(user.id, { isActive: true, emailVerifiedAt: new Date() }),
      this.verificationService.deleteVerificationCode(email),
      this.provisionPersonalWorkspace(user.id, user.name, user.username),
    ])

    return updatedUser
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

    const lockout = await this.verificationService.getVerificationLockout(email)
    if (lockout) {
      const remainingTime = lockout.ttl * 1000
      const { minutes, seconds } = formatRemainingTime(remainingTime)
      const messageKey =
        minutes > 0
          ? 'auth.errors.account_locked'
          : 'auth.errors.account_locked_seconds'
      const args = minutes > 0 ? { minutes, seconds } : { seconds }
      throw new BadRequestException(i18n.t(messageKey, { args }))
    }

    const existingCode =
      await this.verificationService.getVerificationCode(email)

    if (existingCode) {
      const codeAge = Date.now() - new Date(existingCode.createdAt).getTime()

      if (codeAge < this.verificationService.VERIFICATION_CODE_MAX_AGE_MS) {
        const remainingTime =
          this.verificationService.VERIFICATION_CODE_MAX_AGE_MS - codeAge
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
    await this.verificationService.setVerificationCode(
      email,
      code,
      this.verificationService.VERIFICATION_CODE_TTL_SECONDS
    )

    return { message: i18n.t('auth.resend.success') }
  }

  async login(
    data: LoginDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const lockout = await this.verificationService.getLoginLockout(data.email)

    if (lockout) {
      const remainingTime = lockout.ttl * 1000
      const { minutes, seconds } = formatRemainingTime(remainingTime)
      const messageKey =
        minutes > 0
          ? 'auth.errors.account_locked'
          : 'auth.errors.account_locked_seconds'
      const args = minutes > 0 ? { minutes, seconds } : { seconds }
      throw new UnauthorizedException(i18n.t(messageKey, { args }))
    }

    const user = await getUserByEmail(data.email)
    if (!user) {
      throw new UnauthorizedException(i18n.t('auth.errors.invalid_credentials'))
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      data.password
    )
    if (!isPasswordValid) {
      const attempts = await this.verificationService.incrementLoginAttempts(
        data.email
      )

      if (attempts >= this.verificationService.LOGIN_MAX_ATTEMPTS) {
        await this.verificationService.setLoginLockout(
          data.email,
          ipAddress,
          userAgent
        )
        throw new UnauthorizedException(
          i18n.t('auth.errors.too_many_login_attempts')
        )
      }

      throw new UnauthorizedException(i18n.t('auth.errors.invalid_credentials'))
    }

    await Promise.all([
      this.verificationService.resetLoginAttempts(data.email),
      this.verificationService.clearLoginLockoutHistory(data.email),
    ])

    if (!user.isActive) {
      throw new UnauthorizedException(
        i18n.t('auth.errors.account_not_verified')
      )
    }

    const memberships = await OrganizationMembers.listByUser(user.id)
    const primary = pickPrimaryMembership(memberships)

    const role = primary?.role ?? null
    const orgId = primary?.organizationId ?? null

    const { geo, ...session } = await this.sessionService.initiateSession(
      user,
      role,
      orgId,
      userAgent,
      ipAddress
    )

    this.eventEmitter.emit(
      'auth.login.success',
      new LoginSuccessEvent(user.id, ipAddress || null, userAgent || null, geo)
    )

    return session
  }

  async refreshToken(
    data: RefreshTokenDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string,
    existingDeviceSecret?: string
  ) {
    const { jti } = this.jwtService.verifyRefreshToken(data.refreshToken)

    const { revokedData, sessionData } =
      await this.sessionService.validateRefreshSession(jti)

    if (revokedData) {
      await this.sessionService.revokeAllSessions(revokedData.userId)
      this.eventEmitter.emit(
        'auth.security.compromise',
        new SecurityCompromiseEvent(
          revokedData.userId,
          ipAddress || null,
          userAgent || null
        )
      )
      throw new UnauthorizedException(
        i18n.t('auth.errors.reused_refresh_token')
      )
    }

    let storedHash: string
    let userId: number
    let email: string
    let isStaff: boolean
    let role: string | null = null
    let orgId: string | null = null
    let storedFingerprint: string

    if (sessionData) {
      if (sessionData.isRevoked) {
        await this.sessionService.revokeAllSessions(sessionData.userId)
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

      if (sessionData.email !== undefined) {
        email = sessionData.email
        isStaff = sessionData.isStaff
      } else {
        const user = await getUserForSession(userId)
        if (!user) {
          throw new UnauthorizedException(i18n.t('auth.errors.user_not_found'))
        }
        email = user.email
        isStaff = user.isStaff
      }
    } else {
      const dbSession = await Sessions.findByJti(jti)
      if (!dbSession) {
        throw new UnauthorizedException(
          i18n.t('auth.errors.invalid_refresh_token')
        )
      }
      if (dbSession.isRevoked) {
        await this.sessionService.revokeAllSessions(dbSession.userId)
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

      const user = await getUserForSession(userId)
      if (!user) {
        throw new UnauthorizedException(i18n.t('auth.errors.user_not_found'))
      }
      email = user.email
      isStaff = user.isStaff
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
        this.sessionService.deleteSessionCache(jti),
        Sessions.revokeByJti(jti),
      ])
      throw new UnauthorizedException(i18n.t('auth.errors.invalid_client'))
    }

    const { geo: _, ...session } = await this.sessionService.initiateSession(
      { id: userId, email, isStaff },
      role,
      orgId,
      userAgent,
      ipAddress,
      existingDeviceSecret,
      jti
    )

    return session
  }

  getVerificationLockout(email: string) {
    return this.verificationService.getVerificationLockout(email)
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
}
