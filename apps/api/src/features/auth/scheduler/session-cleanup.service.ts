import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron } from '@nestjs/schedule'
import { Sessions, LoginLogs } from '@rufieltics/db/domains/auth'

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name)
  private readonly loginHistoryRetentionDays: number

  constructor(config: ConfigService) {
    this.loginHistoryRetentionDays = config.get<number>(
      'security.loginHistory.retentionDays',
      90
    )
  }

  @Cron('0 2 * * *')
  async cleanupExpiredSessions() {
    const result = await Sessions.deleteExpired(30)
    this.logger.log(`Cleaned up ${result.count} expired sessions`)
  }

  @Cron('0 3 * * *')
  async cleanupOldLoginHistory() {
    const result = await LoginLogs.deleteOlderThan(
      this.loginHistoryRetentionDays
    )
    this.logger.log(
      `Pruned ${result.count} login-history rows older than ${this.loginHistoryRetentionDays} days`
    )
  }
}
