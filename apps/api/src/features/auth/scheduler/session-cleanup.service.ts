import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { Sessions } from '@rufieltics/db/domains/auth'

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name)

  @Cron('0 2 * * *')
  async cleanupExpiredSessions() {
    const result = await Sessions.deleteExpired(30)
    this.logger.log(`Cleaned up ${result.count} expired sessions`)
  }
}
