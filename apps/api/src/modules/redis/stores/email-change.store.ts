import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class EmailChangeStore {
  constructor(private readonly redis: RedisService) {}

  private codeKey(userId: number): string {
    return `emailchange:code:${userId}`
  }

  private attemptsKey(userId: number): string {
    return `emailchange:attempts:${userId}`
  }

  async setCode(
    userId: number,
    newEmail: string,
    code: string,
    ttl = 900
  ): Promise<void> {
    await Promise.all([
      this.redis.set(
        this.codeKey(userId),
        {
          newEmail: newEmail.toLowerCase(),
          code,
          createdAt: new Date().toISOString(),
        },
        ttl
      ),
      this.redis.del(this.attemptsKey(userId)),
    ])
  }

  async getCode(
    userId: number
  ): Promise<{ newEmail: string; code: string; createdAt: string } | null> {
    return this.redis.get(this.codeKey(userId))
  }

  async incrementAttempts(userId: number): Promise<number> {
    const key = this.attemptsKey(userId)
    const count = await this.redis.incr(key)
    if (count === 1) {
      const codeTtl = await this.redis.ttl(this.codeKey(userId))
      await this.redis.expire(key, codeTtl > 0 ? codeTtl : 900)
    }
    return count
  }

  async deleteCode(userId: number): Promise<void> {
    await Promise.all([
      this.redis.del(this.codeKey(userId)),
      this.redis.del(this.attemptsKey(userId)),
    ])
  }
}
