import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { STAFF_REDIS } from '@/modules/redis/redis.constants'

export interface StagedSetup {
  passwordHash: string
  totpSecret: string
}

/**
 * Holds an in-progress staff setup (password hash + TOTP secret) in Redis until
 * the ceremony is confirmed. Nothing is written to the durable account until
 * the staff member completes both steps, so an abandoned setup leaves no
 * half-provisioned credentials behind.
 */
@Injectable()
export class StaffSetupStore {
  private readonly prefix = 'staff:setup:'

  constructor(@Inject(STAFF_REDIS) private readonly redis: Redis) {}

  async stage(
    staffId: string,
    data: StagedSetup,
    ttlSeconds: number
  ): Promise<void> {
    await this.redis.set(
      this.prefix + staffId,
      JSON.stringify(data),
      'EX',
      ttlSeconds
    )
  }

  async get(staffId: string): Promise<StagedSetup | null> {
    const value = await this.redis.get(this.prefix + staffId)
    if (!value) return null
    try {
      return JSON.parse(value) as StagedSetup
    } catch {
      return null
    }
  }

  async remove(staffId: string): Promise<void> {
    await this.redis.del(this.prefix + staffId)
  }
}
