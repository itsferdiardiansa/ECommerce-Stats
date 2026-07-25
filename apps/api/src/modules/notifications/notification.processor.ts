import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { getSecurityNotificationTarget } from '@rufieltics/db/domains/identity/user'
import { renderEmail, type EmailName } from '@rufieltics/emails'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import { GeoService } from '@/modules/geo/geo.service'
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
  [SecurityNotificationKind.PASSWORD_CHANGED]: 'password-changed',
  [SecurityNotificationKind.SECURITY_METHOD_ENABLED]: 'security-method-enabled',
  [SecurityNotificationKind.SECURITY_METHOD_DISABLED]:
    'security-method-disabled',
  [SecurityNotificationKind.RECOVERY_CODE_USED]: 'recovery-code-used',
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
    private readonly geo: GeoService,
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

    const location =
      (await this.geo.resolveLocation(data.context.ipAddress)) ||
      data.context.location

    const template = KIND_TO_TEMPLATE[data.kind]
    const message =
      template === 'security-method-enabled' ||
      template === 'security-method-disabled'
        ? await renderEmail(template, this.defaultLocale, {
            name: target.name,
            method: data.context.method ?? 'totp',
            at: data.context.at ?? new Date().toISOString(),
            device: data.context.device,
            location,
          })
        : await renderEmail(template, this.defaultLocale, {
            name: target.name,
            device: data.context.device,
            location,
            ip: data.context.ipAddress,
          })

    await this.mailQueue.enqueue({ to: target.email, ...message })
  }
}
