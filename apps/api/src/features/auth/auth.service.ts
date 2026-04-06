import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as argon2 from 'argon2'
import { randomUUID } from 'crypto'
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  getUserByEmailIncludingDeleted,
  getUserByUsernameIncludingDeleted,
} from '@rufieltics/db/domains/identity/user'
import {
  Organizations,
  OrganizationMembers,
} from '@rufieltics/db/domains/identity/organization'
import { Sessions } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { JwtService } from '@/modules/jwt/jwt.service'
import { TokenDenylistService } from '@/modules/jwt/token-denylist.service'
import type { AccessTokenPayload } from '@/modules/jwt/jwt.service'
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

interface StoredSession {
  userId: number
  refreshTokenHash: string
  isRevoked: boolean
  expires: string
  role: string | null
  orgId: string | null
}

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenDenylist: TokenDenylistService
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
          const lockout = await this.redisService.getVerificationLockout(email)
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

      const user = await createUser({
        ...rest,
        passwordHash,
        isActive: false,
      })

      const code = generateVerificationCode()
      await this.redisService.setVerificationCode(email, code, 300)

      console.log(`[DEV] Verification code for ${email}: ${code}`)

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

    const storedData = await this.redisService.getVerificationCode(email)

    if (!storedData) {
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    const codeAge = Date.now() - new Date(storedData.createdAt).getTime()
    const maxAge = 5 * 60 * 1000

    if (codeAge > maxAge) {
      await this.redisService.deleteVerificationCode(email)
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    if (storedData.attempts >= 5) {
      await this.redisService.setVerificationLockout(
        email,
        3600,
        'TOO_MANY_ATTEMPTS',
        ipAddress,
        userAgent
      )
      await this.redisService.deleteVerificationCode(email)
      throw new BadRequestException(
        i18n.t('auth.errors.too_many_verification_attempts')
      )
    }

    if (storedData.code !== code) {
      const newAttempts =
        await this.redisService.incrementVerificationAttempts(email)
      const remaining = 5 - newAttempts

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

    const existingCode = await this.redisService.getVerificationCode(email)

    if (existingCode) {
      const codeAge = Date.now() - new Date(existingCode.createdAt).getTime()
      const maxAge = 5 * 60 * 1000

      if (codeAge < maxAge) {
        const remainingTime = maxAge - codeAge
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
    await this.redisService.setVerificationCode(email, code, 300)

    console.log(`[DEV] New verification code for ${email}: ${code}`)

    return {
      message: i18n.t('auth.resend.success'),
    }
  }

  async login(
    data: LoginDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await getUserByEmail(data.email)
    if (!user) {
      throw new UnauthorizedException(i18n.t('auth.errors.email_not_found'))
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      data.password
    )
    if (!isPasswordValid) {
      throw new UnauthorizedException(i18n.t('auth.errors.incorrect_password'))
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        i18n.t('auth.errors.account_not_verified')
      )
    }

    const memberships = await OrganizationMembers.listByUser(user.id)
    const primary = pickPrimaryMembership(memberships)

    const role = primary?.role ?? null
    const orgId = primary?.organizationId ?? null

    const jti = randomUUID()
    const refreshTtl = this.jwtService.getRefreshExpiresIn()
    const expires = new Date(Date.now() + refreshTtl * 1000)

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      isStaff: user.isStaff,
      role,
      orgId,
      jti,
    }

    const accessToken = this.jwtService.signAccessToken(accessPayload)
    const refreshToken = this.jwtService.signRefreshToken(jti)
    const refreshTokenHash = await argon2.hash(refreshToken)

    const { hash: deviceFingerprint, geo } = generateDeviceFingerprint(
      user.id,
      userAgent,
      ipAddress
    )

    const existingSession = await Sessions.findByFingerprint(
      user.id,
      deviceFingerprint
    )
    if (existingSession && existingSession.jti !== jti) {
      await this.redisService.deleteSession(existingSession.jti)
    }

    await Sessions.deleteExpiredByUserId(user.id)

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
        },
        refreshTtl
      ),
    ])

    this.eventEmitter.emit(
      'auth.login.success',
      new LoginSuccessEvent(user.id, ipAddress || null, userAgent || null, geo)
    )

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtService.getAccessExpiresIn(),
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
    }

    const isValid = await argon2.verify(storedHash, data.refreshToken)
    if (!isValid) {
      throw new UnauthorizedException(
        i18n.t('auth.errors.invalid_refresh_token')
      )
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

    const newJti = randomUUID()
    const refreshTtl = this.jwtService.getRefreshExpiresIn()
    const newExpires = new Date(Date.now() + refreshTtl * 1000)

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      isStaff: user.isStaff,
      role,
      orgId,
      jti: newJti,
    }

    const newAccessToken = this.jwtService.signAccessToken(accessPayload)
    const newRefreshToken = this.jwtService.signRefreshToken(newJti)
    const newRefreshTokenHash = await argon2.hash(newRefreshToken)

    const { hash: deviceFingerprint } = generateDeviceFingerprint(
      user.id,
      userAgent,
      ipAddress
    )

    await Promise.all([
      Sessions.upsertByFingerprint({
        userId: user.id,
        jti: newJti,
        refreshTokenHash: newRefreshTokenHash,
        orgId,
        role,
        ipAddress,
        userAgent,
        deviceFingerprint,
        expires: newExpires,
      }),
      this.redisService.setSession(
        newJti,
        {
          userId: user.id,
          refreshTokenHash: newRefreshTokenHash,
          isRevoked: false,
          expires: newExpires.toISOString(),
          role,
          orgId,
        },
        refreshTtl
      ),
    ])

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwtService.getAccessExpiresIn(),
    }
  }

  async logout(jti: string) {
    const sessionData =
      ((await this.redisService.getSession(jti)) as StoredSession | null) ||
      (await Sessions.findByJti(jti))
    const userId = sessionData?.userId

    this.tokenDenylist.deny(jti, this.jwtService.getAccessExpiresIn())

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

    if (otherJtis.length === 0) {
      return {
        message: i18n.t('auth.success.no_other_sessions', {
          defaultValue: 'No other active sessions found.',
        }),
      }
    }

    this.tokenDenylist.denyMany(otherJtis, this.jwtService.getAccessExpiresIn())

    await Promise.all(
      otherJtis.map(jti => this.redisService.deleteSession(jti))
    )

    await Sessions.revokeAllExceptJti(userId, currentJti)

    return {
      message: i18n.t('auth.success.sessions_revoked', {
        defaultValue: 'Successfully signed out of all other devices.',
      }),
    }
  }

  private async revokeAllSessions(userId: number) {
    const activeSessions = await Sessions.findActiveByUserId(userId)
    const jtis = activeSessions.map(session => session.jti)

    if (jtis.length > 0) {
      this.tokenDenylist.denyMany(jtis, this.jwtService.getAccessExpiresIn())
      await Promise.all(jtis.map(jti => this.redisService.deleteSession(jti)))
    }

    await Sessions.revokeAllByUserId(userId)
  }
}
