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
  email: string
  isStaff: boolean
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
    existingDeviceSecret?: string,
    previousJti?: string
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

    const sessionCacheData: StoredSession = {
      userId: user.id,
      email: user.email,
      isStaff: user.isStaff,
      refreshTokenHash,
      isRevoked: false,
      expires: expires.toISOString(),
      role,
      orgId,
      deviceFingerprint,
    }

    if (previousJti) {
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
        this.commitRefreshRotation(
          previousJti,
          jti,
          user.id,
          sessionCacheData,
          refreshTtl
        ),
      ])
    } else {
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
        this.setSessionCache(jti, sessionCacheData, refreshTtl),
      ])
    }

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

  async validateRefreshSession(jti: string): Promise<{
    revokedData: { userId: number } | null
    sessionData: StoredSession | null
  }> {
    const revokedKey = `revoked_jti:${jti}`
    const sessionKey = `session:${jti}`

    const results = await this.redisService.execPipeline<string | null>(
      pipe => {
        pipe.get(revokedKey)
        pipe.get(sessionKey)
      }
    )

    const revokedRaw = results[0]?.[1]
    const sessionRaw = results[1]?.[1]

    const revokedData = revokedRaw
      ? (JSON.parse(revokedRaw) as { userId: number })
      : null

    const sessionData = sessionRaw
      ? (JSON.parse(sessionRaw) as StoredSession)
      : null

    return { revokedData, sessionData }
  }

  async commitRefreshRotation(
    oldJti: string,
    newJti: string,
    userId: number,
    sessionData: StoredSession,
    refreshTtl: number
  ): Promise<void> {
    const serializedRevoked = JSON.stringify({ userId })
    const serializedSession = JSON.stringify(sessionData)

    await this.redisService.execPipeline(pipe => {
      pipe.del(`session:${oldJti}`)
      pipe.setex(`revoked_jti:${oldJti}`, refreshTtl, serializedRevoked)
      pipe.setex(`session:${newJti}`, refreshTtl, serializedSession)
    })
  }

  private async setSessionCache(
    sessionId: string,
    data: StoredSession,
    ttl = 604800
  ): Promise<void> {
    await this.redisService.set(`session:${sessionId}`, data, ttl)
  }
}
