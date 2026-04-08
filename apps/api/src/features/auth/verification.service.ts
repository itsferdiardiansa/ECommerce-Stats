import { Injectable } from '@nestjs/common'
import { Prisma } from '@rufieltics/db'
import { Verification } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'

@Injectable()
export class VerificationService {
  constructor(private readonly redisService: RedisService) {}

  readonly VERIFICATION_CODE_TTL_SECONDS = 300
  readonly VERIFICATION_CODE_MAX_AGE_MS = 5 * 60 * 1000
  readonly VERIFICATION_MAX_ATTEMPTS = 5
  readonly VERIFICATION_LOCKOUT_DURATION_SECONDS = 3600

  async setVerificationCode(
    email: string,
    code: string,
    ttl = 300
  ): Promise<void> {
    const key = `verification:email:${email.toLowerCase()}`
    await this.redisService.set(
      key,
      { code, attempts: 0, createdAt: new Date().toISOString() },
      ttl
    )
  }

  async getVerificationCode(
    email: string
  ): Promise<{ code: string; attempts: number; createdAt: string } | null> {
    return this.redisService.get(`verification:email:${email.toLowerCase()}`)
  }

  async incrementVerificationAttempts(email: string): Promise<number> {
    const key = `verification:email:${email.toLowerCase()}`
    const data = await this.getVerificationCode(email)
    if (!data) return 0

    data.attempts += 1

    const ttl = await this.redisService.ttl(key)
    await this.redisService.set(key, data, ttl > 0 ? ttl : 300)

    return data.attempts
  }

  async deleteVerificationCode(email: string): Promise<void> {
    await this.redisService.del(`verification:email:${email.toLowerCase()}`)
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
      this.redisService.set(
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

    let data = await this.redisService.get<{
      lockedAt: string
      expires: string
    }>(key)

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

      await this.redisService.set(key, data, ttlSeconds)
      return { ...data, ttl: ttlSeconds }
    }

    const ttl = await this.redisService.ttl(key)
    return { ...data, ttl }
  }
}
