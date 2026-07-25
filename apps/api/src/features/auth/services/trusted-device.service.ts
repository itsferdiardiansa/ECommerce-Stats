import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { I18nContext } from 'nestjs-i18n'
import { Sessions, TrustedDevices } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { JwtService } from '@/modules/jwt/jwt.service'
import { TokenDenylistService } from '@/modules/jwt/token-denylist.service'
import { generateDeviceFingerprint } from '@/utils/fingerprint'
import {
  generateTrustedDeviceToken,
  hashTrustedDeviceToken,
} from '@/utils/auth'
import {
  AUTH_EVENTS,
  SecurityMethodChangedEvent,
  TwoFactorEnabledEvent,
} from '../events'

@Injectable()
export class TrustedDeviceService {
  private readonly ttlSeconds: number

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly tokenDenylist: TokenDenylistService,
    private readonly eventEmitter: EventEmitter2,
    config: ConfigService
  ) {
    this.ttlSeconds = config.get<number>(
      'security.trustedDevice.ttlSeconds',
      2592000
    )
  }

  /** Valid trusted-device token for the user? Redis hot path, Postgres fallback. */
  async verify(
    userId: number,
    rawToken: string | undefined,
    fingerprint: string
  ): Promise<boolean> {
    if (!rawToken) return false
    const tokenHash = hashTrustedDeviceToken(rawToken)

    const cachedUserId = await this.redisService.getTrustedDeviceUser(tokenHash)
    if (cachedUserId !== null) return cachedUserId === userId

    const record = await TrustedDevices.findValidByTokenHash(tokenHash)
    if (
      !record ||
      record.userId !== userId ||
      record.deviceFingerprint !== fingerprint
    ) {
      return false
    }

    const ttl = Math.floor((record.expiresAt.getTime() - Date.now()) / 1000)
    await this.redisService.cacheTrustedDevice(tokenHash, userId, ttl)
    return true
  }

  /** Remembers the browser after a passed step-up; returns the cookie token + TTL. */
  async issue(
    userId: number,
    userAgent: string | null,
    ipAddress: string | null
  ): Promise<{ token: string; ttlSeconds: number }> {
    const token = generateTrustedDeviceToken()
    const tokenHash = hashTrustedDeviceToken(token)
    const ttlSeconds = this.ttlSeconds

    const {
      hash: fingerprint,
      device,
      geo,
    } = generateDeviceFingerprint(
      userId,
      userAgent ?? undefined,
      ipAddress ?? undefined
    )
    const label = `${device.browser ?? 'Unknown'} on ${device.os ?? 'Unknown'}`

    await TrustedDevices.create({
      userId,
      tokenHash,
      deviceFingerprint: fingerprint,
      label,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    })
    await this.redisService.cacheTrustedDevice(tokenHash, userId, ttlSeconds)

    this.eventEmitter.emit(
      AUTH_EVENTS.SECURITY_METHOD_CHANGED,
      SecurityMethodChangedEvent.from(
        userId,
        'trusted_device',
        true,
        geo,
        ipAddress,
        userAgent
      )
    )

    return { token, ttlSeconds }
  }

  /** Untrust the devices behind the given fingerprints (on session revoke). */
  async untrustByFingerprints(
    userId: number,
    fingerprints: string[]
  ): Promise<void> {
    const unique = [...new Set(fingerprints.filter(Boolean))]
    if (unique.length === 0) return

    const revoked = await TrustedDevices.revokeByFingerprints(userId, unique)
    await Promise.all([
      ...revoked.map(r => this.redisService.evictTrustedDevice(r.tokenHash)),
      ...unique.map(fp => this.redisService.forgetFactor('device', userId, fp)),
    ])
  }

  async list(userId: number, i18n: I18nContext) {
    const devices = await TrustedDevices.listByUser(userId)
    return {
      message: i18n.t('auth.trusted_devices.list_success', {
        defaultValue: 'Trusted devices retrieved successfully.',
      }),
      data: devices.map(d => ({
        id: d.id,
        label: d.label,
        ipAddress: d.ipAddress,
        lastUsedAt: d.lastUsedAt,
        createdAt: d.createdAt,
        expiresAt: d.expiresAt,
      })),
    }
  }

  async revoke(
    userId: number,
    id: string,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const record = await TrustedDevices.revokeById(userId, id)
    if (!record) {
      throw new NotFoundException(i18n.t('auth.trusted_devices.not_found'))
    }
    await this.redisService.evictTrustedDevice(record.tokenHash)

    const { geo } = generateDeviceFingerprint(userId, userAgent, ipAddress)
    this.eventEmitter.emit(
      AUTH_EVENTS.SECURITY_METHOD_CHANGED,
      SecurityMethodChangedEvent.from(
        userId,
        'trusted_device',
        false,
        geo,
        ipAddress,
        userAgent
      )
    )

    return {
      message: i18n.t('auth.trusted_devices.revoke_success', {
        defaultValue: 'Trusted device removed.',
      }),
    }
  }

  /**
   * Enabling a second factor resets the trust boundary: browsers trusted before
   * it and sessions opened before it must not bypass the new factor. The
   * enrolling session (currentJti) survives. Session revocation goes through the
   * domain directly to avoid a dependency cycle back into the session service.
   */
  @OnEvent(AUTH_EVENTS.TWO_FACTOR_ENABLED)
  async handleTwoFactorEnabled(event: TwoFactorEnabledEvent) {
    const revoked = await TrustedDevices.revokeAllByUser(event.userId)
    await Promise.all(
      revoked.map(r => this.redisService.evictTrustedDevice(r.tokenHash))
    )

    const activeSessions = await Sessions.findActiveByUserId(event.userId)
    const otherJtis = activeSessions
      .map(s => s.jti)
      .filter(jti => jti !== event.currentJti)

    if (otherJtis.length === 0) return

    await this.tokenDenylist.denyMany(
      otherJtis,
      this.jwtService.getAccessExpiresIn()
    )
    await Promise.all(
      otherJtis.map(jti => this.redisService.deleteSession(jti))
    )
    await Sessions.revokeAllExceptJti(event.userId, event.currentJti)
  }
}
