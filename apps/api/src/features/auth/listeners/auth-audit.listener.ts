import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LoginLogs } from '@rufieltics/db/domains/auth'
import { LoginAnomalyService } from '../services/login-anomaly.service'
import {
  AUTH_EVENTS,
  LoginSuccessEvent,
  LoginFailedEvent,
  SecurityAlertEvent,
} from '../events'

/**
 * Records every login outcome to LoginHistory and runs anomaly detection.
 * Detection runs BEFORE the current attempt is persisted so "new device /
 * country" isn't matched against the row we just wrote. When signals fire it
 * emits `auth.security.alert` for the notification layer to act on. Nothing
 * here can break login - it runs off the emitted event, after the response.
 */
@Injectable()
export class AuthAuditListener {
  private readonly logger = new Logger(AuthAuditListener.name)

  constructor(
    private readonly anomaly: LoginAnomalyService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @OnEvent(AUTH_EVENTS.LOGIN_SUCCESS)
  async handleLoginSuccess(event: LoginSuccessEvent) {
    try {
      const signals = await this.anomaly.assessSuccess({
        userId: event.userId,
        deviceFingerprint: event.deviceFingerprint,
        country: event.geo.country,
        latitude: event.geo.latitude,
        longitude: event.geo.longitude,
      })

      await LoginLogs.logSuccess(event.userId, {
        ip: event.ipAddress || undefined,
        agent: event.userAgent || undefined,
        deviceFingerprint: event.deviceFingerprint,
        city: event.geo.city || undefined,
        country: event.geo.country || undefined,
        latitude: event.geo.latitude,
        longitude: event.geo.longitude,
      })

      // If the user already cleared an email-OTP step-up for this login, they've
      // confirmed it's them - recording the device is enough, skip the alert.
      if (signals.length > 0 && !event.stepUpVerified) {
        this.eventEmitter.emit(
          AUTH_EVENTS.SECURITY_ALERT,
          new SecurityAlertEvent(event.userId, signals, {
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            geo: event.geo,
          })
        )
      }
    } catch (error) {
      this.logger.error(
        `Failed to audit successful login for user ${event.userId}: ${error}`
      )
    }
  }

  @OnEvent(AUTH_EVENTS.LOGIN_FAILED)
  async handleLoginFailed(event: LoginFailedEvent) {
    try {
      await LoginLogs.logFailure(event.reason, {
        userId: event.userId,
        attemptedEmail: event.attemptedEmail,
        ip: event.ipAddress || undefined,
        agent: event.userAgent || undefined,
      })

      const signals = await this.anomaly.assessFailure({
        userId: event.userId,
        ipAddress: event.ipAddress,
      })

      // Only alert a real account owner - never notify on an unknown email,
      // which would leak whether it is registered.
      if (signals.length > 0 && event.userId != null) {
        this.eventEmitter.emit(
          AUTH_EVENTS.SECURITY_ALERT,
          new SecurityAlertEvent(event.userId, signals, {
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            geo: null,
          })
        )
      }
    } catch (error) {
      this.logger.error(`Failed to audit failed login: ${error}`)
    }
  }
}
