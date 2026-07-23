import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { NotificationService } from '@/modules/notifications/notification.service'
import { SecurityNotificationKind } from '@/modules/notifications/notification.types'
import {
  AUTH_EVENTS,
  SecurityAlertEvent,
  SecurityCompromiseEvent,
  StepUpVerifiedEvent,
  StepUpBlockedEvent,
} from '../events'

/**
 * Turns security signals into user notifications. Logs for observability, then
 * hands off to the NotificationService (dedupe + enqueue + deliver). Runs off
 * the emitted event, so it never affects auth latency or success.
 */
@Injectable()
export class SecurityAlertListener {
  private readonly logger = new Logger(SecurityAlertListener.name)

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent(AUTH_EVENTS.SECURITY_ALERT)
  async handleSecurityAlert(event: SecurityAlertEvent) {
    const where =
      event.context.geo?.country || event.context.ipAddress || 'Unknown'
    this.logger.warn(
      `[SECURITY] Suspicious login for user ${event.userId} ` +
        `[${event.signals.join(', ')}] from ${where}`
    )

    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.SUSPICIOUS_LOGIN,
      signals: event.signals,
      context: {
        ipAddress: event.context.ipAddress,
        country: event.context.geo?.country ?? null,
      },
    })
  }

  @OnEvent(AUTH_EVENTS.SECURITY_COMPROMISE)
  async handleSecurityCompromise(event: SecurityCompromiseEvent) {
    this.logger.warn(
      `[SECURITY] Refresh token reuse for user ${event.userId} via IP ` +
        `${event.ipAddress || 'Unknown'}. All sessions revoked.`
    )

    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.SESSION_COMPROMISE,
      signals: [],
      context: { ipAddress: event.ipAddress, country: null },
    })
  }

  @OnEvent(AUTH_EVENTS.STEP_UP_VERIFIED)
  async handleStepUpVerified(event: StepUpVerifiedEvent) {
    this.logger.log(
      `[SECURITY] New device sign-in confirmed for user ${event.userId} ` +
        `from ${event.country || event.ipAddress || 'Unknown'}`
    )

    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.NEW_SIGN_IN,
      signals: [],
      context: { ipAddress: event.ipAddress, country: event.country },
    })
  }

  @OnEvent(AUTH_EVENTS.STEP_UP_BLOCKED)
  async handleStepUpBlocked(event: StepUpBlockedEvent) {
    this.logger.warn(
      `[SECURITY] Step-up FAILED for user ${event.userId} from ` +
        `${event.country || event.ipAddress || 'Unknown'} — password may be compromised`
    )

    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.STEP_UP_BLOCKED,
      signals: [],
      context: { ipAddress: event.ipAddress, country: event.country },
    })
  }
}
