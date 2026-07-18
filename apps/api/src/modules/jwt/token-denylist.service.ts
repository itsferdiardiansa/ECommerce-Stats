import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '@/modules/redis/redis.constants'

/**
 * Tracks revoked access tokens (by jti) in Redis so that logout and
 * session revocation are honored across every API instance and survive
 * process restarts. Entries expire automatically via Redis TTL, matching
 * the access token lifetime.
 */
@Injectable()
export class TokenDenylistService {
  private readonly KEY_PREFIX = 'denylist:jti:'

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private key(jti: string): string {
    return `${this.KEY_PREFIX}${jti}`
  }

  async deny(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return
    await this.redis.set(this.key(jti), '1', 'EX', ttlSeconds)
  }

  async denyMany(jtis: string[], ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0 || jtis.length === 0) return

    const pipeline = this.redis.pipeline()
    for (const jti of jtis) {
      pipeline.set(this.key(jti), '1', 'EX', ttlSeconds)
    }
    await pipeline.exec()
  }

  async isDenied(jti: string): Promise<boolean> {
    const exists = await this.redis.exists(this.key(jti))
    return exists === 1
  }
}
