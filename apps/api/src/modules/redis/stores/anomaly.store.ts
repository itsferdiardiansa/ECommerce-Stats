import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { randomUUID } from 'crypto'
import { REDIS_CLIENT } from '../redis.constants'

@Injectable()
export class AnomalyStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  private knownFactorKey(kind: 'device' | 'country', userId: number): string {
    return `known:${kind}:${userId}`
  }

  /**
   * Records a login failure for `scope` (e.g. `user:42` or `ip:1.2.3.4`) and
   * returns how many failures fall inside the rolling window. Uses a Redis
   * sorted set as a true sliding window, so brute-force detection is O(log n).
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
    ttlSeconds = 7776000
  ): Promise<void> {
    const key = this.knownFactorKey(kind, userId)
    await this.redisClient
      .multi()
      .sadd(key, value)
      .expire(key, ttlSeconds)
      .exec()
  }

  async forgetFactor(
    kind: 'device' | 'country',
    userId: number,
    value: string
  ): Promise<void> {
    await this.redisClient.srem(this.knownFactorKey(kind, userId), value)
  }
}
