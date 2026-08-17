import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { StaffSessions } from '@rufieltics/db/domains/internal'
import { verifyDeviceBinding } from '@rufieltics/auth-server'
import { StaffTokenService } from '../staff-token.service'
import type { StaffAccessPayload } from '../staff-token.service'

export interface StaffRequestUser {
  id: string
  jti: string
}

interface AuthedRequest {
  headers: Record<string, string | undefined>
  cookies?: Record<string, string | undefined>
  staff?: StaffRequestUser
}

const DEVICE_COOKIE = 'staffDeviceSecret'

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly tokens: StaffTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>()
    const header = req.headers['authorization']
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        message: 'common.errors.unauthorized',
        code: 'SESSION_INVALID',
      })
    }

    let payload: StaffAccessPayload
    try {
      payload = this.tokens.verifyAccess(header.slice(7))
    } catch {
      throw new UnauthorizedException({
        message: 'common.errors.unauthorized',
        code: 'SESSION_INVALID',
      })
    }

    const session = await StaffSessions.findByJti(payload.jti)
    if (!session || session.isRevoked || session.expires <= new Date()) {
      throw new UnauthorizedException({
        message: 'staff.errors.session_expired',
        code: 'SESSION_INVALID',
      })
    }

    // Device binding: enforced only when the token carries it, so sessions
    // issued before binding shipped keep working until they refresh.
    if (payload.fph && payload.env) {
      const bound = verifyDeviceBinding(
        { fph: payload.fph, env: payload.env },
        {
          id: payload.sub,
          deviceSecret: req.cookies?.[DEVICE_COOKIE],
          userAgent: req.headers['user-agent'],
        }
      )
      if (!bound) {
        throw new UnauthorizedException({
          message: 'staff.errors.session_expired',
          code: 'SESSION_INVALID',
        })
      }
    }

    req.staff = { id: payload.sub, jti: payload.jti }
    return true
  }
}
