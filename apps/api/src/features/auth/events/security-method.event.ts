import type { SecurityMethod } from '@/modules/notifications/notification.types'
import { formatLocation, formatDevice } from '@/utils/fingerprint'
import type { LoginGeo } from './login-success.event'

export class SecurityMethodChangedEvent {
  constructor(
    public readonly userId: number,
    public readonly method: SecurityMethod,
    public readonly enabled: boolean,
    public readonly ipAddress: string | null,
    public readonly location: string | null,
    public readonly device: string | null,
    public readonly at: string = new Date().toISOString()
  ) {}

  /** Builds the event from the request's geo/device context. */
  static from(
    userId: number,
    method: SecurityMethod,
    enabled: boolean,
    geo: LoginGeo,
    ipAddress?: string | null,
    userAgent?: string | null
  ): SecurityMethodChangedEvent {
    return new SecurityMethodChangedEvent(
      userId,
      method,
      enabled,
      ipAddress ?? null,
      formatLocation(geo),
      formatDevice(userAgent ?? null)
    )
  }
}
