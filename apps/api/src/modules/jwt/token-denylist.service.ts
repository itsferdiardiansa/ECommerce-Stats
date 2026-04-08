import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@/modules/redis/redis.service'

@Injectable()
export class TokenDenylistService {
  private readonly logger = new Logger(TokenDenylistService.name)
  private readonly KEY_PREFIX = 'denylist:'

  constructor(private readonly redisService: RedisService) {}

  async deny(jti: string, ttlSeconds: number): Promise<void> {
    await this.redisService.set(`${this.KEY_PREFIX}${jti}`, '1', ttlSeconds)
  }

  async denyMany(jtis: string[], ttlSeconds: number): Promise<void> {
    await Promise.all(
      jtis.map(jti =>
        this.redisService.set(`${this.KEY_PREFIX}${jti}`, '1', ttlSeconds)
      )
    )
  }

  async isDenied(jti: string): Promise<boolean> {
    return this.redisService.exists(`${this.KEY_PREFIX}${jti}`)
  }
}
