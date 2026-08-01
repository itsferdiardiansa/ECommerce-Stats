import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class WebauthnStore {
  constructor(private readonly redis: RedisService) {}

  private key(scope: string, id: string | number): string {
    return `webauthn:${scope}:${id}`
  }

  /** Short-lived WebAuthn challenge (single-use); scope is reg | auth | sudo. */
  async setChallenge(
    scope: string,
    id: string | number,
    data: object,
    ttl: number
  ): Promise<void> {
    await this.redis.set(this.key(scope, id), data, ttl)
  }

  async getChallenge<T = Record<string, unknown>>(
    scope: string,
    id: string | number
  ): Promise<T | null> {
    return this.redis.get<T>(this.key(scope, id))
  }

  async deleteChallenge(scope: string, id: string | number): Promise<void> {
    await this.redis.del(this.key(scope, id))
  }
}
