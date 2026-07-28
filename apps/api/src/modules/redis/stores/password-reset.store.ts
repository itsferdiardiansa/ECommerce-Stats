import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class PasswordResetStore {
  constructor(private readonly redis: RedisService) {}

  private key(tokenHash: string): string {
    return `pwreset:token:${tokenHash}`
  }

  /** Stores only the SHA-256 of the reset token, so a Redis leak is not usable. */
  async set(tokenHash: string, userId: number, ttl = 900): Promise<void> {
    await this.redis.set(this.key(tokenHash), { userId }, ttl)
  }

  async get(tokenHash: string): Promise<{ userId: number } | null> {
    return this.redis.get(this.key(tokenHash))
  }

  async delete(tokenHash: string): Promise<void> {
    await this.redis.del(this.key(tokenHash))
  }
}
