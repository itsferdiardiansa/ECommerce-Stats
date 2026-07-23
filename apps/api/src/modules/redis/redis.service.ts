import { Injectable, Inject } from '@nestjs/common'
import { randomUUID } from 'crypto'
import Redis from 'ioredis'
import { REDIS_CLIENT } from './redis.constants'
import { Verification } from '@rufieltics/db/domains/auth'
import { Prisma } from '@rufieltics/db'

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {
    console.log('[RedisService] Initialized with ioredis client')
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)

    if (ttl > 0) {
      await this.redisClient.setex(key, ttl, serialized)
    } else {
      await this.redisClient.set(key, serialized)
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key)
  }

  async incr(key: string): Promise<number> {
    return await this.redisClient.incr(key)
  }

  async setNX(key: string, value: string, ttl: number): Promise<boolean> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    const result = await this.redisClient.set(key, serialized, 'EX', ttl, 'NX')
    return result === 'OK'
  }

  private verificationCodeKey(email: string): string {
    return `verification:email:${email.toLowerCase()}`
  }

  private verificationAttemptsKey(email: string): string {
    return `verification:attempts:${email.toLowerCase()}`
  }

  async setVerificationCode(
    email: string,
    code: string,
    ttl = 300
  ): Promise<void> {
    await Promise.all([
      this.set(
        this.verificationCodeKey(email),
        { code, createdAt: new Date().toISOString() },
        ttl
      ),
      // Reset the attempt counter so a freshly issued code starts clean.
      this.del(this.verificationAttemptsKey(email)),
    ])
  }

  async getVerificationCode(
    email: string
  ): Promise<{ code: string; createdAt: string } | null> {
    return this.get(this.verificationCodeKey(email))
  }

  /**
   * Atomically increments and returns the verification attempt count via Redis
   * INCR, so concurrent requests cannot bypass the attempt cap (no read-modify
   * -write race). The counter is expired in lockstep with the code's remaining
   * lifetime on first use.
   */
  async incrementVerificationAttempts(email: string): Promise<number> {
    const attemptsKey = this.verificationAttemptsKey(email)
    const count = await this.redisClient.incr(attemptsKey)

    if (count === 1) {
      const codeTtl = await this.redisClient.ttl(
        this.verificationCodeKey(email)
      )
      await this.redisClient.expire(attemptsKey, codeTtl > 0 ? codeTtl : 300)
    }

    return count
  }

  async deleteVerificationCode(email: string): Promise<void> {
    await Promise.all([
      this.del(this.verificationCodeKey(email)),
      this.del(this.verificationAttemptsKey(email)),
    ])
  }

  private stepUpChallengeKey(id: string): string {
    return `stepup:challenge:${id}`
  }

  private stepUpAttemptsKey(id: string): string {
    return `stepup:attempts:${id}`
  }

  async setStepUpChallenge(
    id: string,
    data: object,
    ttl: number
  ): Promise<void> {
    await Promise.all([
      this.set(this.stepUpChallengeKey(id), data, ttl),
      this.del(this.stepUpAttemptsKey(id)),
    ])
  }

  async getStepUpChallenge<T = Record<string, unknown>>(
    id: string
  ): Promise<T | null> {
    return this.get<T>(this.stepUpChallengeKey(id))
  }

  /** Atomic attempt counter for a step-up challenge (same guarantee as email verification). */
  async incrementStepUpAttempts(id: string): Promise<number> {
    const attemptsKey = this.stepUpAttemptsKey(id)
    const count = await this.redisClient.incr(attemptsKey)

    if (count === 1) {
      const ttl = await this.redisClient.ttl(this.stepUpChallengeKey(id))
      await this.redisClient.expire(attemptsKey, ttl > 0 ? ttl : 600)
    }

    return count
  }

  async deleteStepUpChallenge(id: string): Promise<void> {
    await Promise.all([
      this.del(this.stepUpChallengeKey(id)),
      this.del(this.stepUpAttemptsKey(id)),
    ])
  }

  async setVerificationLockout(
    email: string,
    ttl = 3600,
    reason: Prisma.VerificationLockoutReason = 'TOO_MANY_ATTEMPTS',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const key = `verification:lockout:${email.toLowerCase()}`
    const lockedAt = new Date()
    const expires = new Date(Date.now() + ttl * 1000)

    const existingLockout =
      await Verification.findActiveVerificationLockout(email)
    if (existingLockout) {
      await Verification.clearVerificationLockout(existingLockout.id)
    }

    await Promise.all([
      this.set(
        key,
        { lockedAt: lockedAt.toISOString(), expires: expires.toISOString() },
        ttl
      ),
      Verification.createVerificationLockout({
        email: email.toLowerCase(),
        reason,
        ipAddress,
        userAgent,
        lockedAt,
        expires,
      }),
    ])
  }

  async getVerificationLockout(
    email: string
  ): Promise<{ lockedAt: string; expires: string; ttl: number } | null> {
    const key = `verification:lockout:${email.toLowerCase()}`

    let data = await this.get<{ lockedAt: string; expires: string }>(key)

    if (!data) {
      const dbLockout = await Verification.findActiveVerificationLockout(email)
      if (!dbLockout) return null

      const ttlSeconds = Math.floor(
        (dbLockout.expires.getTime() - Date.now()) / 1000
      )
      if (ttlSeconds <= 0) return null

      data = {
        lockedAt: dbLockout.lockedAt.toISOString(),
        expires: dbLockout.expires.toISOString(),
      }

      await this.set(key, data, ttlSeconds)

      return { ...data, ttl: ttlSeconds }
    }

    const ttl = await this.redisClient.ttl(key)
    return { ...data, ttl }
  }

  async deleteVerificationLockout(email: string): Promise<void> {
    const key = `verification:lockout:${email.toLowerCase()}`
    await this.del(key)
  }

  async checkVerificationRateLimit(
    email: string,
    maxAttempts = 3,
    ttl = 3600
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `verification:ratelimit:${email.toLowerCase()}`
    const current = (await this.get<number>(key)) || 0

    if (current >= maxAttempts) {
      return { allowed: false, remaining: 0 }
    }

    const newCount = await this.incr(key)

    if (newCount === 1) {
      await this.redisClient.expire(key, ttl)
    }

    return {
      allowed: true,
      remaining: maxAttempts - newCount,
    }
  }

  /**
   * Records a login failure for `scope` (e.g. `user:42` or `ip:1.2.3.4`) and
   * returns how many failures fall inside the rolling window. Uses a Redis
   * sorted set as a true sliding window, so brute-force detection is O(log n)
   * in Redis instead of a growing `count(*)` over the audit table.
   */
  async recordLoginFailure(
    scope: string,
    windowSeconds = 900
  ): Promise<number> {
    const key = `bruteforce:${scope}`
    const now = Date.now()
    const cutoff = now - windowSeconds * 1000

    const results = await this.redisClient
      .multi()
      .zadd(key, now, `${now}-${randomUUID()}`)
      .zremrangebyscore(key, 0, cutoff)
      .zcard(key)
      .expire(key, windowSeconds)
      .exec()

    const card = results?.[2]?.[1]
    return typeof card === 'number' ? card : 0
  }

  /**
   * "Known device / country" cache backing new-device and new-country
   * detection. A hit is an O(1) SISMEMBER, avoiding a DB read on the common
   * case of a returning device. Populated on every successful login and warmed
   * from history on a cache miss (see LoginAnomalyService).
   */
  async isKnownFactor(
    kind: 'device' | 'country',
    userId: number,
    value: string
  ): Promise<boolean> {
    const exists = await this.redisClient.sismember(
      this.knownFactorKey(kind, userId),
      value
    )
    return exists === 1
  }

  async rememberFactor(
    kind: 'device' | 'country',
    userId: number,
    value: string,
    ttlSeconds = 7776000 // 90 days
  ): Promise<void> {
    const key = this.knownFactorKey(kind, userId)
    await this.redisClient
      .multi()
      .sadd(key, value)
      .expire(key, ttlSeconds)
      .exec()
  }

  private knownFactorKey(kind: 'device' | 'country', userId: number): string {
    return `known:${kind}:${userId}`
  }

  async setSession(
    sessionId: string,
    data: Record<string, unknown>,
    ttl = 604800
  ): Promise<void> {
    const key = `session:${sessionId}`
    await this.set(key, data, ttl)
  }

  async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    const key = `session:${sessionId}`
    return this.get(key)
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    await this.del(key)
  }

  async setPaymentIntent(
    intentId: string,
    data: Record<string, unknown>,
    ttl = 1800
  ): Promise<void> {
    const key = `payment:intent:${intentId}`
    await this.set(key, data, ttl)
  }

  async getPaymentIntent(
    intentId: string
  ): Promise<Record<string, unknown> | null> {
    const key = `payment:intent:${intentId}`
    return this.get(key)
  }

  async cacheUser(
    userId: number,
    data: Record<string, unknown>,
    ttl = 600
  ): Promise<void> {
    const key = `cache:user:${userId}`
    await this.set(key, data, ttl)
  }

  async getCachedUser(userId: number): Promise<Record<string, unknown> | null> {
    const key = `cache:user:${userId}`
    return this.get(key)
  }

  async invalidateUserCache(userId: number): Promise<void> {
    const key = `cache:user:${userId}`
    await this.del(key)
  }
}
