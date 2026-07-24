import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { randomUUID } from 'crypto'
import { RedisService } from '@/modules/redis/redis.service'
import {
  NOTIFICATIONS_QUEUE,
  SecurityNotificationJob,
  SecurityNotificationKind,
} from './notification.types'

/**
 * Entry point for security notifications. Deduplicates cheaply in Redis (so a
 * repeated signal doesn't flood the queue or the user's inbox), then enqueues a
 * durable delivery job. Recipient resolution, preference checks, and rendering
 * happen in the worker — keeping this path light.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private readonly dedupeTtlSeconds: number

  constructor(
    private readonly redis: RedisService,
    config: ConfigService,
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly queue: Queue<SecurityNotificationJob>
  ) {
    this.dedupeTtlSeconds = config.get<number>(
      'security.notificationDedupeTtlSeconds',
      86400
    )
  }

  async notifySecurity(job: SecurityNotificationJob): Promise<void> {
    const dedupeKey = this.dedupeKey(job)
    const allowed = await this.redis.setNX(
      `notif:${dedupeKey}`,
      '1',
      this.dedupeTtlSeconds
    )
    if (!allowed) {
      this.logger.debug(`Deduped security notification ${dedupeKey}`)
      return
    }

    await this.queue.add(job.kind, job, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    })
  }

  /**
   * Collapses repeats within the dedupe window. Deliberate account changes are
   * never collapsed — each one must reach the owner.
   */
  private dedupeKey(job: SecurityNotificationJob): string {
    let scope: string
    switch (job.kind) {
      case SecurityNotificationKind.SUSPICIOUS_LOGIN:
        scope = [...job.signals].sort().join('-')
        break
      case SecurityNotificationKind.NEW_SIGN_IN:
      case SecurityNotificationKind.STEP_UP_BLOCKED:
        scope = job.context.location || job.context.ipAddress || 'unknown'
        break
      case SecurityNotificationKind.PASSWORD_CHANGED:
      case SecurityNotificationKind.SECURITY_METHOD_ENABLED:
      case SecurityNotificationKind.SECURITY_METHOD_DISABLED:
        scope = `${job.context.method ?? 'password'}:${randomUUID()}`
        break
      default:
        scope = 'compromise'
    }
    return `sec:${job.userId}:${job.kind}:${scope}`
  }
}
