import type { SecurityMethod } from '@/modules/notifications/notification.types'

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
}
