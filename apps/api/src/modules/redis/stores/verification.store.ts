import { Injectable } from '@nestjs/common'
import { Prisma } from '@rufieltics/db'
import { Verification } from '@rufieltics/db/domains/auth'
import { RedisService } from '../redis.service'

@Injectable()
export class VerificationStore {
  constructor(private readonly redis: RedisService) {}

  private codeKey(email: string): string {
    return `verification:email:${email.toLowerCase()}`
  }

  private attemptsKey(email: string): string {
    return `verification:attempts:${email.toLowerCase()}`
  }

  private lockoutKey(email: string): string {
    return `verification:lockout:${email.toLowerCase()}`
  }

  async setCode(email: string, code: string, ttl = 300): Promise<void> {
    await Promise.all([
      this.redis.set(
        this.codeKey(email),
        { code, createdAt: new Date().toISOString() },
        ttl
      ),
      this.redis.del(this.attemptsKey(email)),
    ])
  }

  async getCode(
    email: string
  ): Promise<{ code: string; createdAt: string } | null> {
    return this.redis.get(this.codeKey(email))
  }

  async incrementAttempts(email: string): Promise<number> {
    const key = this.attemptsKey(email)
    const count = await this.redis.incr(key)
    if (count === 1) {
      const codeTtl = await this.redis.ttl(this.codeKey(email))
      await this.redis.expire(key, codeTtl > 0 ? codeTtl : 300)
    }
    return count
  }

  async deleteCode(email: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.codeKey(email)),
      this.redis.del(this.attemptsKey(email)),
    ])
  }

  async setLockout(
    email: string,
    ttl = 3600,
    reason: Prisma.VerificationLockoutReason = 'TOO_MANY_ATTEMPTS',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const lockedAt = new Date()
    const expires = new Date(Date.now() + ttl * 1000)

    const existing = await Verification.findActiveVerificationLockout(email)
    if (existing) {
      await Verification.clearVerificationLockout(existing.id)
    }

    await Promise.all([
      this.redis.set(
        this.lockoutKey(email),
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

  async getLockout(
    email: string
  ): Promise<{ lockedAt: string; expires: string; ttl: number } | null> {
    const key = this.lockoutKey(email)
    let data = await this.redis.get<{ lockedAt: string; expires: string }>(key)

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
      await this.redis.set(key, data, ttlSeconds)
      return { ...data, ttl: ttlSeconds }
    }

    const ttl = await this.redis.ttl(key)
    return { ...data, ttl }
  }

  async deleteLockout(email: string): Promise<void> {
    await this.redis.del(this.lockoutKey(email))
  }
}
