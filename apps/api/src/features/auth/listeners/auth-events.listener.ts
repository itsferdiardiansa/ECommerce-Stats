import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { LoginLogs } from '@rufieltics/db/domains/auth'

export class SecurityCompromiseEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null
  ) {}
}

export class LoginSuccessEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly geo: {
      latitude: number | null
      longitude: number | null
      city: string | null
      country: string | null
    }
  ) {}
}

@Injectable()
export class AuthEventsListener {
  private readonly logger = new Logger(AuthEventsListener.name)

  @OnEvent('auth.login.success')
  async handleLoginSuccessEvent(event: LoginSuccessEvent) {
    try {
      await LoginLogs.logSuccess(event.userId, {
        ip: event.ipAddress || undefined,
        agent: event.userAgent || undefined,
        city: event.geo.city || undefined,
        country: event.geo.country || undefined,
        latitude: event.geo.latitude,
        longitude: event.geo.longitude,
      })
      this.logger.debug(`Audit log recorded for User ${event.userId}`)
    } catch (error) {
      this.logger.error(
        `Failed to record audit log for User ${event.userId}: ${error}`
      )
    }
  }

  @OnEvent('auth.security.compromise')
  handleSecurityCompromiseEvent(event: SecurityCompromiseEvent) {
    this.logger.warn(
      `[SECURITY] Refresh Token Reuse detected for User ${event.userId} via IP ${event.ipAddress || 'Unknown'}. All active sessions have been immediately revoked.`
    )
    // Note: Can hook email delivery service here to notify user of high-risk login activity
  }
}
