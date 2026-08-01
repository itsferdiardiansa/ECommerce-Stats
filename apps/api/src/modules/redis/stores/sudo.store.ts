import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class SudoStore {
  constructor(private readonly redis: RedisService) {}

  private key(jti: string): string {
    return `sudo:${jti}`
  }

  private attemptsKey(jti: string): string {
    return `sudo:attempts:${jti}`
  }

  async grant(jti: string, ttlSeconds: number): Promise<void> {
    await Promise.all([
      this.redis.set(this.key(jti), 1, ttlSeconds),
      this.redis.del(this.attemptsKey(jti)),
    ])
  }

  async getTtl(jti: string): Promise<number | null> {
    const ttl = await this.redis.ttl(this.key(jti))
    return ttl > 0 ? ttl : null
  }

  async revoke(jti: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.key(jti)),
      this.redis.del(this.attemptsKey(jti)),
    ])
  }

  async incrementAttempts(jti: string, windowSeconds: number): Promise<number> {
    const key = this.attemptsKey(jti)
    const count = await this.redis.incr(key)
    if (count === 1) {
      await this.redis.expire(key, windowSeconds)
    }
    return count
  }
}
