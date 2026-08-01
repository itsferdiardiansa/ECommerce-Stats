import { Injectable } from '@nestjs/common'
import { RedisService } from '../redis.service'

@Injectable()
export class MfaEnrolmentStore {
  constructor(private readonly redis: RedisService) {}

  private pendingTotpKey(userId: number): string {
    return `totp:pending:${userId}`
  }

  async setPendingTotp(
    userId: number,
    encryptedSecret: string,
    ttlSeconds: number
  ): Promise<void> {
    await this.redis.set(
      this.pendingTotpKey(userId),
      encryptedSecret,
      ttlSeconds
    )
  }

  async getPendingTotp(userId: number): Promise<string | null> {
    return this.redis.get<string>(this.pendingTotpKey(userId))
  }

  async deletePendingTotp(userId: number): Promise<void> {
    await this.redis.del(this.pendingTotpKey(userId))
  }
}
