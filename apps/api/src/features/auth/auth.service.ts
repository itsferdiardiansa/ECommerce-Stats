import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as argon2 from 'argon2'
import { createHash, randomBytes, randomUUID } from 'crypto'
import {
  getSessionUser,
  updateUser,
  getUserCredentials,
} from '@rufieltics/db/domains/identity/user'
import {
  Sessions,
  TrustedDevices,
  PasswordSecurity,
} from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { JwtService } from '@/modules/jwt/jwt.service'
import { TokenDenylistService } from '@/modules/jwt/token-denylist.service'
import { TrustedDeviceService } from './services/trusted-device.service'
import type { AccessTokenPayload } from '@/modules/jwt/jwt.service'
import type { RefreshTokenDto } from './dto/refresh-token.dto'
import {
  generateDeviceFingerprint,
  formatLocation,
  formatDevice,
} from '@/utils/fingerprint'
import {
  AUTH_EVENTS,
  SecurityCompromiseEvent,
  PasswordChangedEvent,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenDenylist: TokenDenylistService,
    private readonly trustedDevices: TrustedDeviceService
  ) {}

  async initiateSession(
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

    const user = await getSessionUser(userId)
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
