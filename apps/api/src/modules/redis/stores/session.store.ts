import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'
import { SudoStore } from './sudo.store'

@Injectable()
export class SessionStore {
  constructor(
    private readonly redis: RedisService,
    private readonly sudo: SudoStore
  ) {}

  private key(sessionId: string): string {
    return `session:${sessionId}`
  }

  async set(
    sessionId: string,
    data: Record<string, unknown>,
    ttl = 604800
  ): Promise<void> {
    await this.redis.set(this.key(sessionId), data, ttl)
  }

  async get(sessionId: string): Promise<Record<string, unknown> | null> {
    return this.redis.get(this.key(sessionId))
  }

  /** Dropping a session also drops its sudo grant - elevation is session-scoped. */
  async delete(sessionId: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.key(sessionId)),
      this.sudo.revoke(sessionId),
    ])
  }
}
