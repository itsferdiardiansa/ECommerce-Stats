import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

export interface StaffAccessPayload {
  sub: string
  jti: string
  typ: 'staff-access'
  /** device-secret hash (device binding) */
  fph?: string
  /** environment (browser/os) hash (device binding) */
  env?: string
}

export interface DeviceBinding {
  fph: string
  env: string
}
export interface StaffRefreshPayload {
  sub: string
  jti: string
  typ: 'staff-refresh'
}
export interface StaffMfaPayload {
  sub: string
  typ: 'staff-mfa'
}
export interface StaffInvitePayload {
  sub: string
  typ: 'staff-invite'
}
export interface StaffTotpResetPayload {
  sub: string
  typ: 'staff-totp-reset'
}

@Injectable()
export class StaffTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  private get accessSecret(): string {
    return this.config.getOrThrow<string>('STAFF_JWT_SECRET')
  }

  private get inviteSecret(): string {
    return this.config.getOrThrow<string>('STAFF_INVITE_SECRET')
  }

  signAccess(sub: string, jti: string, binding?: DeviceBinding): string {
    return this.jwt.sign(
      { sub, jti, typ: 'staff-access', ...binding },
      { secret: this.accessSecret, expiresIn: '15m' }
    )
  }

  signRefresh(sub: string, jti: string): string {
    return this.jwt.sign(
      { sub, jti, typ: 'staff-refresh' },
      { secret: this.accessSecret, expiresIn: '7d' }
    )
  }

  signMfa(sub: string): string {
    return this.jwt.sign(
      { sub, typ: 'staff-mfa' },
      { secret: this.accessSecret, expiresIn: '5m' }
    )
  }

  signInvite(sub: string): string {
    return this.jwt.sign(
      { sub, typ: 'staff-invite' },
      { secret: this.inviteSecret, expiresIn: '7d' }
    )
  }

  verifyAccess(token: string): StaffAccessPayload {
    return this.jwt.verify<StaffAccessPayload>(token, {
      secret: this.accessSecret,
    })
  }

  verifyRefresh(token: string): StaffRefreshPayload {
    return this.jwt.verify<StaffRefreshPayload>(token, {
      secret: this.accessSecret,
    })
  }

  verifyMfa(token: string): StaffMfaPayload {
    return this.jwt.verify<StaffMfaPayload>(token, {
      secret: this.accessSecret,
    })
  }

  verifyInvite(token: string): StaffInvitePayload {
    return this.jwt.verify<StaffInvitePayload>(token, {
      secret: this.inviteSecret,
    })
  }

  signTotpReset(sub: string): string {
    return this.jwt.sign(
      { sub, typ: 'staff-totp-reset' },
      { secret: this.inviteSecret, expiresIn: '30m' }
    )
  }

  verifyTotpReset(token: string): StaffTotpResetPayload {
    return this.jwt.verify<StaffTotpResetPayload>(token, {
      secret: this.inviteSecret,
    })
  }

  getAccessExpiresIn(): number {
    return 15 * 60
  }

  getRefreshExpiresIn(): number {
    return 7 * 24 * 60 * 60
  }
}
