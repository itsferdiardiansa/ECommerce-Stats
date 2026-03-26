import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from './redis.constants'
import { Verification } from '@rufieltics/db/domains/auth'

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

  async setNX(key: string, value: any, ttl: number): Promise<boolean> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    const result = await this.redisClient.set(key, serialized, 'EX', ttl, 'NX')
    return result === 'OK'
  }

  async setVerificationCode(
    email: string,
    code: string,
    ttl = 300
  ): Promise<void> {
    const key = `verification:email:${email.toLowerCase()}`
    await this.set(
      key,
      {
        code,
        attempts: 0,
        createdAt: new Date().toISOString(),
      },
      ttl
    )
  }

  async getVerificationCode(
    email: string
  ): Promise<{ code: string; attempts: number; createdAt: string } | null> {
    const key = `verification:email:${email.toLowerCase()}`
    return this.get(key)
  }

  async incrementVerificationAttempts(email: string): Promise<number> {
    const key = `verification:email:${email.toLowerCase()}`
    const data = await this.getVerificationCode(email)
    if (!data) return 0

    data.attempts += 1

    const ttl = await this.redisClient.ttl(key)
    if (ttl > 0) {
      await this.set(key, data, ttl)
    } else {
      await this.set(key, data, 300)
    }

    return data.attempts
  }

  async deleteVerificationCode(email: string): Promise<void> {
    const key = `verification:email:${email.toLowerCase()}`
    await this.del(key)
  }

  async setVerificationLockout(
    email: string,
    ttl = 3600,
    reason = 'TOO_MANY_ATTEMPTS',
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
        reason: reason as
          | 'TOO_MANY_ATTEMPTS'
          | 'SUSPICIOUS_ACTIVITY'
          | 'MANUAL_LOCK',
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
