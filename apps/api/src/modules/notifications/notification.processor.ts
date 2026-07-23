import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { getSecurityNotificationTarget } from '@rufieltics/db/domains/identity/user'
import { renderEmail, type EmailName } from '@rufieltics/emails'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import {
  NOTIFICATIONS_QUEUE,
  SecurityNotificationJob,
  SecurityNotificationKind,
} from './notification.types'

const KIND_TO_TEMPLATE: Record<SecurityNotificationKind, EmailName> = {
  [SecurityNotificationKind.SUSPICIOUS_LOGIN]: 'suspicious-login',
  [SecurityNotificationKind.NEW_SIGN_IN]: 'new-sign-in',
  [SecurityNotificationKind.STEP_UP_BLOCKED]: 'blocked-attempt',
  [SecurityNotificationKind.SESSION_COMPROMISE]: 'session-compromise',
}

/**
 * Consumes queued security notifications: resolves the recipient, honors the
 * user's email-alert preference, renders the template, and hands the message to
 * the mail delivery queue.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name)
  private readonly defaultLocale: string

  constructor(
    private readonly mailQueue: MailQueueService,
    config: ConfigService
  ) {
    super()
    // No request context here, and we don't store a per-user locale yet, so
    // security notifications use the app's fallback language.
    this.defaultLocale = config.get<string>('APP_FALLBACK_LANG', 'en')
  }

  async process(job: Job<SecurityNotificationJob>): Promise<void> {
    const data = job.data
    const target = await getSecurityNotificationTarget(data.userId)

    if (!target) {
      this.logger.warn(`No recipient for user ${data.userId}; dropping`)
      return
    }
    if (!target.alertsEmail) {
      this.logger.debug(`User ${data.userId} opted out of email alerts`)
      return
    }

    const where =
      data.context.country || data.context.ipAddress || 'an unknown location'

    const message = await renderEmail(
      KIND_TO_TEMPLATE[data.kind],
      this.defaultLocale,
      { name: target.name, where }
    )

    await this.mailQueue.enqueue({ to: target.email, ...message })
  }
}
