/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@rufieltics/db'
import { Verification, LoginLockouts } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'

@Injectable()
export class VerificationService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {}

  readonly VERIFICATION_CODE_TTL_SECONDS = 300
  readonly VERIFICATION_CODE_MAX_AGE_MS = 5 * 60 * 1000
  readonly VERIFICATION_MAX_ATTEMPTS = 5
  readonly VERIFICATION_LOCKOUT_DURATION_SECONDS = 3600
  private readonly LOGIN_LOCKOUT_STEPS = [1800, 7200, 43200, 86400]
  private readonly LOGIN_ATTEMPTS_TTL_SECONDS = 900

  get LOGIN_MAX_ATTEMPTS(): number {
    const throttleLimit = this.configService.get<number>(
      'throttle.auth.limit',
      5
    )
    return throttleLimit * 2
  }

  private codeKey(email: string) {
    return `verification:email:${email.toLowerCase()}`
  }

  private attemptsKey(email: string) {
    return `verification:email:${email.toLowerCase()}:attempts`
  }

  async setVerificationCode(
    email: string,
    code: string,
    ttl = 300
  ): Promise<void> {
    // Store code and metadata separately from the attempt counter so the
    // counter can be incremented atomically without touching the code object.
    await Promise.all([
      this.redisService.set(
        this.codeKey(email),
        { code, createdAt: new Date().toISOString() },
        ttl
      ),
      this.redisService.del(this.attemptsKey(email)),
    ])
  }

  async getVerificationCode(
    email: string
  ): Promise<{ code: string; attempts: number; createdAt: string } | null> {
    const data = await this.redisService.get<{
      code: string
      createdAt: string
    }>(this.codeKey(email))

    if (!data) return null

    const attempts =
      (await this.redisService.get<number>(this.attemptsKey(email))) ?? 0

    return { ...data, attempts }
  }

  async incrementVerificationAttempts(email: string): Promise<number> {
    const key = this.attemptsKey(email)
    const count = await this.redisService.incr(key)

    if (count === 1) {
      // Sync TTL with the code key so both expire together.
      const codeTtl = await this.redisService.ttl(this.codeKey(email))
      await this.redisService.expire(
        key,
        codeTtl > 0 ? codeTtl : this.VERIFICATION_CODE_TTL_SECONDS
      )
    }

    return count
  }

  async deleteVerificationCode(email: string): Promise<void> {
    await Promise.all([
      this.redisService.del(this.codeKey(email)),
      this.redisService.del(this.attemptsKey(email)),
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

  async incrementLoginAttempts(email: string): Promise<number> {
    const key = `login:attempts:${email.toLowerCase()}`
    const count = await this.redisService.incr(key)
    if (count === 1) {
      await this.redisService.expire(key, this.LOGIN_ATTEMPTS_TTL_SECONDS)
    }
    return count
  }

  async resetLoginAttempts(email: string): Promise<void> {
    await this.redisService.del(`login:attempts:${email.toLowerCase()}`)
  }

  async setLoginLockout(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const key = `login:lockout:${email.toLowerCase()}`
    const lockedAt = new Date()

    const [existingLockout, priorCount] = await Promise.all([
      LoginLockouts.findActive(email),
      LoginLockouts.countAllForEmail(email),
    ])

    if (existingLockout) {
      await LoginLockouts.clear(existingLockout.id)
    }

    const ttl =
      this.LOGIN_LOCKOUT_STEPS[
        Math.min(priorCount, this.LOGIN_LOCKOUT_STEPS.length - 1)
      ]
    const expires = new Date(Date.now() + ttl * 1000)

    await Promise.all([
      this.redisService.set(
        key,
        { lockedAt: lockedAt.toISOString(), expires: expires.toISOString() },
        ttl
      ),
      LoginLockouts.create({
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
        lockedAt,
        expires,
      }),
    ])
  }

  async clearLoginLockoutHistory(email: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`login:lockout:${email.toLowerCase()}`),
      LoginLockouts.clearAllForEmail(email),
    ])
  }

  async getLoginLockout(
    email: string
  ): Promise<{ lockedAt: string; expires: string; ttl: number } | null> {
    const key = `login:lockout:${email.toLowerCase()}`

    let data = await this.redisService.get<{
      lockedAt: string
      expires: string
    }>(key)

    if (!data) {
      const dbLockout = await LoginLockouts.findActive(email)
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
