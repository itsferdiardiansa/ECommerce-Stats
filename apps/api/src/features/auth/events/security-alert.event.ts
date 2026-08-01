import type { RiskSignal } from '../services/login-anomaly.service'
import type { LoginGeo } from './login-success.event'

export class SecurityAlertEvent {
  constructor(
    public readonly userId: number,
    public readonly signals: RiskSignal[],
    public readonly context: {
      ipAddress: string | null
      userAgent: string | null
      geo: LoginGeo | null
    }
  ) {}
}
