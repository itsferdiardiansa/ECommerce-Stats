import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from './redis.constants'

/**
 * Thin, feature-agnostic Redis client: connection + generic primitives only.
 * Feature-specific access lives in the per-feature stores under ./stores.
 */
@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

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

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key)
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds)
  }
}
