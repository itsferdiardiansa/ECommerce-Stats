import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class StepUpStore {
  constructor(private readonly redis: RedisService) {}

  private challengeKey(id: string): string {
    return `stepup:challenge:${id}`
  }

  private attemptsKey(id: string): string {
    return `stepup:attempts:${id}`
  }

  private userFailKey(userId: number): string {
    return `stepup:fail:${userId}`
  }

  async setChallenge(id: string, data: object, ttl: number): Promise<void> {
    await Promise.all([
      this.redis.set(this.challengeKey(id), data, ttl),
      this.redis.del(this.attemptsKey(id)),
    ])
  }

  async getChallenge<T = Record<string, unknown>>(
    id: string
  ): Promise<T | null> {
    return this.redis.get<T>(this.challengeKey(id))
  }

  async incrementAttempts(id: string): Promise<number> {
    const key = this.attemptsKey(id)
    const count = await this.redis.incr(key)
    if (count === 1) {
      const ttl = await this.redis.ttl(this.challengeKey(id))
      await this.redis.expire(key, ttl > 0 ? ttl : 600)
    }
    return count
  }

  async deleteChallenge(id: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.challengeKey(id)),
      this.redis.del(this.attemptsKey(id)),
    ])
  }

  /**
   * Cumulative failed step-up attempts for a user across every challenge, so
   * spinning up fresh challenges can't reset the attempt budget. Fixed window.
   */
  async incrementUserFailures(userId: number, ttl: number): Promise<number> {
    const key = this.userFailKey(userId)
    const count = await this.redis.incr(key)
    if (count === 1) {
      await this.redis.expire(key, ttl)
    }
    return count
  }

  async getUserFailures(userId: number): Promise<number> {
    return (await this.redis.get<number>(this.userFailKey(userId))) ?? 0
  }

  async resetUserFailures(userId: number): Promise<void> {
    await this.redis.del(this.userFailKey(userId))
  }
}
