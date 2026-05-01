/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common'
import { Prisma } from '@rufieltics/db'
import {
  Verification,
  LoginLockouts,
  PhoneVerification,
} from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'

@Injectable()
export class VerificationService {
  constructor(private readonly redisService: RedisService) {}

  readonly VERIFICATION_CODE_TTL_SECONDS = 300
  readonly VERIFICATION_CODE_MAX_AGE_MS = 5 * 60 * 1000
  readonly VERIFICATION_MAX_ATTEMPTS = 3
  readonly VERIFICATION_LOCKOUT_DURATION_SECONDS = 86400 // 24 hours
  private readonly LOGIN_LOCKOUT_STEPS = [3600, 7200, 43200, 86400] // min 1h
  private readonly LOGIN_ATTEMPTS_TTL_SECONDS = 900

  // 5 attempts per 15-minute window before lockout triggers.
  readonly LOGIN_MAX_ATTEMPTS = 5

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
    userAgent?: string,
    reason:
      | 'TOO_MANY_ATTEMPTS'
      | 'SUSPICIOUS_ACTIVITY'
      | 'MANUAL_LOCK' = 'TOO_MANY_ATTEMPTS',
    ttlOverride?: number
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

    let ttl: number
    if (ttlOverride !== undefined) {
      ttl = ttlOverride
    } else if (reason === 'SUSPICIOUS_ACTIVITY') {
      ttl = this.LOGIN_LOCKOUT_STEPS[this.LOGIN_LOCKOUT_STEPS.length - 1]
    } else {
      ttl =
        this.LOGIN_LOCKOUT_STEPS[
          Math.min(priorCount, this.LOGIN_LOCKOUT_STEPS.length - 1)
        ]
    }

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
        reason,
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

  // ─── Phone verification ───────────────────────────────────────────────────

  // 6-digit OTP, valid 10 minutes, max 3 wrong attempts before 24 h lockout.
  // Sending is rate-gated: a new OTP cannot be requested until the current one
  // expires (cost protection — each SMS costs money).
  readonly PHONE_OTP_TTL_SECONDS = 600 // 10 minutes
  readonly PHONE_OTP_MAX_AGE_MS = 10 * 60 * 1000
  readonly PHONE_OTP_MAX_ATTEMPTS = 3
  readonly PHONE_LOCKOUT_DURATION_SECONDS = 86400 // 24 hours

  private phoneOtpKey(phone: string) {
    return `phone:otp:${phone}`
  }

  private phoneAttemptsKey(phone: string, userId: number) {
    return `phone:otp:${phone}:${userId}:attempts`
  }

  private phoneLockoutKey(phone: string, userId: number) {
    return `phone:lockout:${phone}:${userId}`
  }

  async setPhoneOtp(
    phone: string,
    code: string,
    userId: number
  ): Promise<void> {
    await Promise.all([
      this.redisService.set(
        this.phoneOtpKey(phone),
        { code, userId, createdAt: new Date().toISOString() },
        this.PHONE_OTP_TTL_SECONDS
      ),
      this.redisService.del(this.phoneAttemptsKey(phone, userId)),
    ])
  }

  async getPhoneOtp(phone: string): Promise<{
    code: string
    userId: number
    attempts: number
    createdAt: string
  } | null> {
    const data = await this.redisService.get<{
      code: string
      userId: number
      createdAt: string
    }>(this.phoneOtpKey(phone))

    if (!data) return null

    const attempts =
      (await this.redisService.get<number>(
        this.phoneAttemptsKey(phone, data.userId)
      )) ?? 0

    return { ...data, attempts }
  }

  async incrementPhoneOtpAttempts(
    phone: string,
    userId: number
  ): Promise<number> {
    const key = this.phoneAttemptsKey(phone, userId)
    const count = await this.redisService.incr(key)

    if (count === 1) {
      const otpTtl = await this.redisService.ttl(this.phoneOtpKey(phone))
      await this.redisService.expire(
        key,
        otpTtl > 0 ? otpTtl : this.PHONE_OTP_TTL_SECONDS
      )
    }

    return count
  }

  async deletePhoneOtp(phone: string, userId: number): Promise<void> {
    await Promise.all([
      this.redisService.del(this.phoneOtpKey(phone)),
      this.redisService.del(this.phoneAttemptsKey(phone, userId)),
    ])
  }

  async setPhoneLockout(
    phone: string,
    userId: number,
    reason:
      | 'TOO_MANY_ATTEMPTS'
      | 'SUSPICIOUS_ACTIVITY'
      | 'MANUAL_LOCK' = 'TOO_MANY_ATTEMPTS',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const key = this.phoneLockoutKey(phone, userId)
    const lockedAt = new Date()
    const expires = new Date(
      Date.now() + this.PHONE_LOCKOUT_DURATION_SECONDS * 1000
    )

    await Promise.all([
      this.redisService.set(
        key,
        {
          lockedAt: lockedAt.toISOString(),
          expires: expires.toISOString(),
          reason,
        },
        this.PHONE_LOCKOUT_DURATION_SECONDS
      ),
      PhoneVerification.createLockout({
        phone,
        userId,
        reason,
        ipAddress,
        userAgent,
        expires,
      }),
    ])
  }

  async getPhoneLockout(
    phone: string,
    userId: number
  ): Promise<{
    lockedAt: string
    expires: string
    ttl: number
    reason: string
  } | null> {
    const key = this.phoneLockoutKey(phone, userId)

    let data = await this.redisService.get<{
      lockedAt: string
      expires: string
      reason: string
    }>(key)

    if (!data) {
      const dbLockout = await PhoneVerification.findActiveLockout(phone, userId)
      if (!dbLockout) return null

      const ttlSeconds = Math.floor(
        (dbLockout.expires.getTime() - Date.now()) / 1000
      )
      if (ttlSeconds <= 0) return null

      data = {
        lockedAt: dbLockout.lockedAt.toISOString(),
        expires: dbLockout.expires.toISOString(),
        reason: dbLockout.reason,
      }

      await this.redisService.set(key, data, ttlSeconds)
      return { ...data, ttl: ttlSeconds }
    }

    const ttl = await this.redisService.ttl(key)
    return { ...data, ttl }
  }

  async clearPhoneLockout(phone: string, userId: number): Promise<void> {
    await Promise.all([
      this.redisService.del(this.phoneLockoutKey(phone, userId)),
      PhoneVerification.clearActiveLockout(phone, userId),
    ])
  }
}
