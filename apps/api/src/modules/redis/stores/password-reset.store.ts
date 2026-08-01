import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class PasswordResetStore {
  constructor(private readonly redis: RedisService) {}

  private key(tokenHash: string): string {
    return `pwreset:token:${tokenHash}`
  }

  private userKey(userId: number): string {
    return `pwreset:user:${userId}`
  }

  async issue(userId: number, tokenHash: string, ttl = 900): Promise<void> {
    const previous = await this.redis.get<string>(this.userKey(userId))
    if (previous) await this.redis.del(this.key(previous))
    await this.redis.set(this.key(tokenHash), { userId }, ttl)
    await this.redis.set(this.userKey(userId), tokenHash, ttl)
  }

  async get(tokenHash: string): Promise<{ userId: number } | null> {
    return this.redis.get(this.key(tokenHash))
  }

  async clear(userId: number, tokenHash: string): Promise<void> {
    await this.redis.del(this.key(tokenHash))
    await this.redis.del(this.userKey(userId))
  }

  private cooldownKey(email: string): string {
    return `pwreset:cooldown:${email.toLowerCase()}`
  }

  private countKey(email: string): string {
    return `pwreset:count:${email.toLowerCase()}`
  }

  async getResendCooldown(email: string): Promise<number> {
    const ttl = await this.redis.ttl(this.cooldownKey(email))
    return ttl > 0 ? ttl : 0
  }

  async setResendCooldown(email: string, seconds: number): Promise<void> {
    await this.redis.set(this.cooldownKey(email), 1, seconds)
  }

  async incrementResendCount(email: string): Promise<number> {
    const key = this.countKey(email)
    const count = await this.redis.incr(key)
    if (count === 1) await this.redis.expire(key, 86400)
    return count
  }
}
