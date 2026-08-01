import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class OAuthStateStore {
  constructor(private readonly redis: RedisService) {}

  private key(provider: string, state: string): string {
    return `oauth:state:${provider}:${state}`
  }

  async set(
    provider: string,
    state: string,
    data: { codeVerifier: string },
    ttl: number
  ): Promise<void> {
    await this.redis.set(this.key(provider, state), data, ttl)
  }

  async get(
    provider: string,
    state: string
  ): Promise<{ codeVerifier: string } | null> {
    return this.redis.get<{ codeVerifier: string }>(this.key(provider, state))
  }

  async delete(provider: string, state: string): Promise<void> {
    await this.redis.del(this.key(provider, state))
  }
}
