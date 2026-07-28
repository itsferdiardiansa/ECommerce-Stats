import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoginLogs } from '@rufieltics/db/domains/auth'
import { AnomalyStore } from '@/modules/redis/stores'

/**
 * A single anomaly signal detected for a login. Emitted with the alert so
 * downstream notifications can explain *why* an attempt was flagged.
 */
export enum RiskSignal {
  NEW_DEVICE = 'NEW_DEVICE',
  NEW_LOCATION = 'NEW_LOCATION',
  IMPOSSIBLE_TRAVEL = 'IMPOSSIBLE_TRAVEL',
  BRUTE_FORCE = 'BRUTE_FORCE',
}

export interface SuccessContext {
  userId: number
  deviceFingerprint: string
  country: string | null
  latitude: number | null
  longitude: number | null
}

export interface FailureContext {
  userId: number | null
  ipAddress: string | null
}

/**
 * Risk assessment for login attempts. Pure detection — it never sends
 * notifications or mutates auth state.
 *
 * Hot paths are served from Redis so detection stays cheap at high request
 * volume: brute-force counting is a Redis sliding window (not a growing
 * `count(*)`), and "known device/location" is an O(1) set lookup that only
 * falls back to Postgres on a cache miss (then warms the cache).
 */
@Injectable()
export class LoginAnomalyService {
  private readonly bruteForceWindowSeconds: number
  private readonly bruteForceThreshold: number
  private readonly maxTravelKmh: number
  private readonly knownFactorTtlSeconds: number

  constructor(
    private readonly redis: AnomalyStore,
    config: ConfigService
  ) {
    this.bruteForceWindowSeconds = config.get<number>(
      'security.bruteForce.windowSeconds',
      900
    )
    this.bruteForceThreshold = config.get<number>(
      'security.bruteForce.threshold',
      5
    )
    this.maxTravelKmh = config.get<number>('security.impossibleTravelKmh', 900)
    this.knownFactorTtlSeconds = config.get<number>(
      'security.knownFactorTtlSeconds',
      7776000
    )
  }

  /**
   * Read-only risk evaluation for a successful password check. Used to decide
   * whether to challenge (step-up) *before* a session is issued — it does NOT
   * mutate the known-factor cache, so calling it can't mark the current device
   * as "known" and suppress its own signal.
   */
  async previewSuccessRisk(ctx: SuccessContext): Promise<RiskSignal[]> {
    const signals: RiskSignal[] = []

    if (await this.isNewFactor('device', ctx.userId, ctx.deviceFingerprint)) {
      signals.push(RiskSignal.NEW_DEVICE)
    }

    if (
      ctx.country &&
      (await this.isNewFactor('country', ctx.userId, ctx.country))
    ) {
      signals.push(RiskSignal.NEW_LOCATION)
    }

    if (ctx.latitude != null && ctx.longitude != null) {
      const last = await LoginLogs.lastSuccessWithGeo(ctx.userId)
      if (
        last &&
        last.latitude != null &&
        last.longitude != null &&
        this.isImpossibleTravel(
          { lat: last.latitude, lng: last.longitude, at: last.createdAt },
          { lat: ctx.latitude, lng: ctx.longitude, at: new Date() }
        )
      ) {
        signals.push(RiskSignal.IMPOSSIBLE_TRAVEL)
      }
    }

    return signals
  }

  /**
   * Assess a *successful* login and record its factors as "known". Must be
   * called BEFORE the current attempt is written to LoginHistory, otherwise
   * "new device/location" would match the row just inserted.
   */
  async assessSuccess(ctx: SuccessContext): Promise<RiskSignal[]> {
    const signals = await this.previewSuccessRisk(ctx)

    await this.redis.rememberFactor(
      'device',
      ctx.userId,
      ctx.deviceFingerprint,
      this.knownFactorTtlSeconds
    )
    if (ctx.country) {
      await this.redis.rememberFactor(
        'country',
        ctx.userId,
        ctx.country,
        this.knownFactorTtlSeconds
      )
    }

    return signals
  }

  /** Assess a *failed* login for brute-force / credential-stuffing patterns. */
  async assessFailure(ctx: FailureContext): Promise<RiskSignal[]> {
    let peak = 0

    if (ctx.userId != null) {
      peak = Math.max(
        peak,
        await this.redis.recordLoginFailure(
          `user:${ctx.userId}`,
          this.bruteForceWindowSeconds
        )
      )
    }
    if (ctx.ipAddress) {
      peak = Math.max(
        peak,
        await this.redis.recordLoginFailure(
          `ip:${ctx.ipAddress}`,
          this.bruteForceWindowSeconds
        )
      )
    }

    return peak >= this.bruteForceThreshold ? [RiskSignal.BRUTE_FORCE] : []
  }

  /**
   * New if neither the Redis cache nor (on a miss) the historical LoginHistory
   * has seen this factor for the user. A DB hit warms the cache for next time.
   */
  private async isNewFactor(
    kind: 'device' | 'country',
    userId: number,
    value: string
  ): Promise<boolean> {
    if (await this.redis.isKnownFactor(kind, userId, value)) return false

    const seenInHistory =
      kind === 'device'
        ? await LoginLogs.hasSeenDevice(userId, value)
        : await LoginLogs.hasSeenCountry(userId, value)

    if (seenInHistory) {
      await this.redis.rememberFactor(
        kind,
        userId,
        value,
        this.knownFactorTtlSeconds
      )
      return false
    }

    return true
  }

  private isImpossibleTravel(
    from: { lat: number; lng: number; at: Date },
    to: { lat: number; lng: number; at: Date }
  ): boolean {
    const hours =
      Math.abs(to.at.getTime() - from.at.getTime()) / (1000 * 60 * 60)
    if (hours <= 0) return false

    const km = this.haversineKm(from.lat, from.lng, to.lat, to.lng)
    // Ignore near-identical coordinates (GPS/geo jitter).
    if (km < 50) return false

    return km / hours > this.maxTravelKmh
  }

  private haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371
    const toRad = (d: number) => (d * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
  }
}
