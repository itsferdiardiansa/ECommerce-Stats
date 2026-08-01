import { Injectable } from '@nestjs/common'
import { randomBytes, createHash } from 'crypto'
import { RedisService } from '../redis.service'

@Injectable()
export class SecureAccountStore {
  constructor(private readonly redis: RedisService) {}

  private key(tokenHash: string): string {
    return `secure:token:${tokenHash}`
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Mints a token and returns the raw value. Not single-active: any alert
   * email the user received should be able to freeze the account, so tokens
   * coexist and self-expire. `issuedAt` lets a later password reset invalidate
   * links minted before it.
   */
  async issue(userId: number, ttl: number): Promise<string> {
    const token = randomBytes(32).toString('hex')
    await this.redis.set(
      this.key(this.hash(token)),
      { userId, issuedAt: Date.now() },
      ttl
    )
    return token
  }

  async get(
    token: string
  ): Promise<{ userId: number; issuedAt?: number } | null> {
    return this.redis.get(this.key(this.hash(token)))
  }

  async clear(token: string): Promise<void> {
    await this.redis.del(this.key(this.hash(token)))
  }
}
