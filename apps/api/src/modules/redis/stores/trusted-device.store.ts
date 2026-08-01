import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

/**
 * Hot cache for trusted-device lookups: tokenHash -> userId, TTL = trust
 * lifetime. Postgres remains the durable source of truth (see TrustedDevices).
 */
@Injectable()
export class TrustedDeviceStore {
  constructor(private readonly redis: RedisService) {}

  private key(tokenHash: string): string {
    return `trusted:${tokenHash}`
  }

  async cache(
    tokenHash: string,
    userId: number,
    ttlSeconds: number
  ): Promise<void> {
    if (ttlSeconds <= 0) return
    await this.redis.set(this.key(tokenHash), userId, ttlSeconds)
  }

  async getUser(tokenHash: string): Promise<number | null> {
    const value = await this.redis.get<number>(this.key(tokenHash))
    return typeof value === 'number' ? value : null
  }

  async evict(tokenHash: string): Promise<void> {
    await this.redis.del(this.key(tokenHash))
  }
}
