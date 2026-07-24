import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { formatLocation, formatDevice } from '@/utils/fingerprint'
import { NotificationService } from '@/modules/notifications/notification.service'
import { SecurityNotificationKind } from '@/modules/notifications/notification.types'
import {
  AUTH_EVENTS,
  SecurityAlertEvent,
  SecurityCompromiseEvent,
  StepUpVerifiedEvent,
  StepUpBlockedEvent,
  PasswordChangedEvent,
  SecurityMethodChangedEvent,
} from '../events'

/** Turns security signals into user notifications (dedupe + enqueue + deliver). */
@Injectable()
export class SecurityAlertListener {
  private readonly logger = new Logger(SecurityAlertListener.name)

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent(AUTH_EVENTS.SECURITY_ALERT)
  async handleSecurityAlert(event: SecurityAlertEvent) {
    const location = event.context.geo
      ? formatLocation(event.context.geo)
      : null
    this.logger.warn(
      `[SECURITY] Suspicious login for user ${event.userId} ` +
        `[${event.signals.join(', ')}] from ${location || event.context.ipAddress || 'Unknown'}`
    )

    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.SUSPICIOUS_LOGIN,
      signals: event.signals,
      context: {
        ipAddress: event.context.ipAddress,
        location,
        device: formatDevice(event.context.userAgent),
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
      context: {
        ipAddress: event.ipAddress,
        location: null,
        device: formatDevice(event.userAgent),
      },
    })
  }

  @OnEvent(AUTH_EVENTS.STEP_UP_VERIFIED)
  async handleStepUpVerified(event: StepUpVerifiedEvent) {
    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.NEW_SIGN_IN,
      signals: [],
      context: {
        ipAddress: event.ipAddress,
        location: event.location,
        device: event.device,
      },
    })
  }

  @OnEvent(AUTH_EVENTS.PASSWORD_CHANGED)
  async handlePasswordChanged(event: PasswordChangedEvent) {
    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.PASSWORD_CHANGED,
      signals: [],
      context: {
        ipAddress: event.ipAddress,
        location: event.location,
        device: event.device,
      },
    })
  }

  @OnEvent(AUTH_EVENTS.SECURITY_METHOD_CHANGED)
  async handleSecurityMethodChanged(event: SecurityMethodChangedEvent) {
    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: event.enabled
        ? SecurityNotificationKind.SECURITY_METHOD_ENABLED
        : SecurityNotificationKind.SECURITY_METHOD_DISABLED,
      signals: [],
      context: {
        ipAddress: event.ipAddress,
        location: event.location,
        device: event.device,
        method: event.method,
        at: event.at,
      },
    })
  }

  @OnEvent(AUTH_EVENTS.STEP_UP_BLOCKED)
  async handleStepUpBlocked(event: StepUpBlockedEvent) {
    this.logger.warn(
      `[SECURITY] Step-up FAILED for user ${event.userId} from ` +
        `${event.location || event.ipAddress || 'Unknown'} — password may be compromised`
    )

    await this.notifications.notifySecurity({
      userId: event.userId,
      kind: SecurityNotificationKind.STEP_UP_BLOCKED,
      signals: [],
      context: {
        ipAddress: event.ipAddress,
        location: event.location,
        device: event.device,
      },
    })
  }
}
