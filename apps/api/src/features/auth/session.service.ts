import { Injectable } from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { Sessions } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { JwtService } from '@/modules/jwt/jwt.service'
import { TokenDenylistService } from '@/modules/jwt/token-denylist.service'
import type { AccessTokenPayload } from '@/modules/jwt/jwt.service'
import { generateDeviceFingerprint } from '@/utils/fingerprint'

export interface StoredSession {
  userId: number
  refreshTokenHash: string
  isRevoked: boolean
  expires: string
  role: string | null
  orgId: string | null
  deviceFingerprint: string
}

@Injectable()
export class SessionService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly tokenDenylist: TokenDenylistService
  ) {}

  async initiateSession(
    user: { id: number; email: string; isStaff: boolean },
    role: string | null,
    orgId: string | null,
    userAgent?: string,
    ipAddress?: string,
    existingDeviceSecret?: string
  ) {
    const jti = randomUUID()
    const refreshTtl = this.jwtService.getRefreshExpiresIn()
    const expires = new Date(Date.now() + refreshTtl * 1000)
    const rawDeviceSecret =
      existingDeviceSecret ?? randomBytes(32).toString('hex')
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
      await this.deleteSessionCache(existingSession.jti)
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
      this.setSessionCache(
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
      geo,
    }
  }

  async logout(jti: string): Promise<void> {
    const sessionData =
      ((await this.getSessionCache(jti)) as StoredSession | null) ||
      (await Sessions.findByJti(jti))
    const userId = sessionData?.userId

    await this.tokenDenylist.deny(jti, this.jwtService.getAccessExpiresIn())

    await Promise.all([
      this.deleteSessionCache(jti),
      Sessions.revokeByJti(jti),
      userId ? this.markJtiRevoked(jti, userId) : Promise.resolve(),
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
    await Promise.all(otherJtis.map(jti => this.deleteSessionCache(jti)))
    await Sessions.revokeAllExceptJti(userId, currentJti)

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

    await this.tokenDenylist.denyMany(
      jtis,
      this.jwtService.getAccessExpiresIn()
    )
    await Promise.all(jtis.map(jti => this.deleteSessionCache(jti)))
    await Sessions.revokeSessionsByJtis(userId, jtis)

    return {
      message: i18n.t('auth.success.sessions_revoked', {
        defaultValue: 'Successfully signed out of selected devices.',
      }),
    }
  }

  async revokeAllSessions(userId: number): Promise<void> {
    const activeSessions = await Sessions.findActiveByUserId(userId)
    const jtis = activeSessions.map(session => session.jti)

    if (jtis.length > 0) {
      await this.tokenDenylist.denyMany(
        jtis,
        this.jwtService.getAccessExpiresIn()
      )
      await Promise.all(jtis.map(jti => this.deleteSessionCache(jti)))
    }

    await Sessions.revokeAllByUserId(userId)
  }

  async markJtiRevoked(jti: string, userId: number): Promise<void> {
    await this.redisService.set(
      `revoked_jti:${jti}`,
      { userId },
      this.jwtService.getRefreshExpiresIn()
    )
  }

  async getJtiRevocation(jti: string): Promise<{ userId: number } | null> {
    return this.redisService.get<{ userId: number }>(`revoked_jti:${jti}`)
  }

  async getSessionCache(
    sessionId: string
  ): Promise<Record<string, unknown> | null> {
    return this.redisService.get(`session:${sessionId}`)
  }

  async deleteSessionCache(sessionId: string): Promise<void> {
    await this.redisService.del(`session:${sessionId}`)
  }

  private async setSessionCache(
    sessionId: string,
    data: Record<string, unknown>,
    ttl = 604800
  ): Promise<void> {
    await this.redisService.set(`session:${sessionId}`, data, ttl)
  }
}
