import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import type { LockoutStore } from '@rufieltics/auth-server'
import { STAFF_REDIS } from '@/modules/redis/redis.constants'

@Injectable()
export class StaffLockoutStore implements LockoutStore {
  private readonly failPrefix = 'staff:lockout:fail:'
  private readonly lockPrefix = 'staff:lockout:lock:'

  constructor(@Inject(STAFF_REDIS) private readonly redis: Redis) {}

  async recordFailure(key: string, windowSeconds: number): Promise<number> {
    const k = this.failPrefix + key
    const count = await this.redis.incr(k)
    if (count === 1) await this.redis.expire(k, windowSeconds)
    return count
  }

  async getFailures(key: string): Promise<number> {
    const value = await this.redis.get(this.failPrefix + key)
    return value ? Number(value) : 0
  }

  async setLock(key: string, until: number): Promise<void> {
    const ttl = Math.ceil((until - Date.now()) / 1000)
    if (ttl <= 0) return
    await this.redis.set(this.lockPrefix + key, String(until), 'EX', ttl)
  }

  async getLock(key: string): Promise<number | null> {
    const value = await this.redis.get(this.lockPrefix + key)
    return value ? Number(value) : null
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(this.failPrefix + key, this.lockPrefix + key)
  }
}
