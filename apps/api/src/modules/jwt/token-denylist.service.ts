import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class TokenDenylistService {
  private readonly logger = new Logger(TokenDenylistService.name)
  private readonly denied = new Map<string, number>()
  private readonly cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000)
  }

  deny(jti: string, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.denied.set(jti, expiresAt)
  }

  denyMany(jtis: string[], ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    for (const jti of jtis) {
      this.denied.set(jti, expiresAt)
    }
  }

  isDenied(jti: string): boolean {
    const expiresAt = this.denied.get(jti)
    if (expiresAt === undefined) return false

    if (Date.now() >= expiresAt) {
      this.denied.delete(jti)
      return false
    }
    return true
  }

  private cleanup(): void {
    const now = Date.now()
    let purged = 0
    for (const [jti, expiresAt] of this.denied) {
      if (now >= expiresAt) {
        this.denied.delete(jti)
        purged++
      }
    }
    if (purged > 0) {
      this.logger.debug(`Purged ${purged} expired denylist entries`)
    }
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval)
  }
}
