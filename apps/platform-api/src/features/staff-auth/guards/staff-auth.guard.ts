import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { StaffSessions } from '@rufieltics/db/domains/internal'
import { StaffTokenService } from '../staff-token.service'
import type { StaffAccessPayload } from '../staff-token.service'

export interface StaffRequestUser {
  id: string
  jti: string
}

interface AuthedRequest {
  headers: Record<string, string | undefined>
  staff?: StaffRequestUser
}

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly tokens: StaffTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>()
    const header = req.headers['authorization']
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('common.errors.unauthorized')
    }

    let payload: StaffAccessPayload
    try {
      payload = this.tokens.verifyAccess(header.slice(7))
    } catch {
      throw new UnauthorizedException('common.errors.unauthorized')
    }

    const session = await StaffSessions.findByJti(payload.jti)
    if (!session || session.isRevoked || session.expires <= new Date()) {
      throw new UnauthorizedException('staff.errors.session_expired')
    }

    req.staff = { id: payload.sub, jti: payload.jti }
    return true
  }
}
