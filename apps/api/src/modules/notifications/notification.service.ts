import { Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { RedisService } from '@/modules/redis/redis.service'
import { REDIS_CLIENT } from '@/modules/redis/redis.constants'
import {
  NOTIFICATIONS_QUEUE,
  SecurityNotificationJob,
  SecurityNotificationKind,
} from './notification.types'

const ALWAYS_DELIVER = new Set<SecurityNotificationKind>([
  SecurityNotificationKind.PASSWORD_CHANGED,
  SecurityNotificationKind.SECURITY_METHOD_ENABLED,
  SecurityNotificationKind.SECURITY_METHOD_DISABLED,
  SecurityNotificationKind.RECOVERY_CODE_USED,
])

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
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly queue: Queue<SecurityNotificationJob>
  ) {
    this.dedupeTtlSeconds = config.get<number>(
      'security.notificationDedupeTtlSeconds',
      86400
    )
  }

  /**
   * Drops a user's alert-dedupe markers so the next event reaches them
   * immediately. Called after a security action (freeze/recovery): once the
   * user has engaged, re-alerting on fresh activity matters more than the
   * anti-spam throttle. SCAN keeps it non-blocking.
   */
  async clearDedupe(userId: number): Promise<void> {
    const pattern = `notif:sec:${userId}:*`
    let cursor = '0'
    do {
      const [next, keys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      )
      cursor = next
      if (keys.length) await this.redisClient.del(...keys)
    } while (cursor !== '0')
  }

  async notifySecurity(job: SecurityNotificationJob): Promise<void> {
    if (!ALWAYS_DELIVER.has(job.kind)) {
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
      default:
        scope = 'compromise'
    }
    return `sec:${job.userId}:${job.kind}:${scope}`
  }
}
