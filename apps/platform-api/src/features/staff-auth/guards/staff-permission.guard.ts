import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { getStaffPermissions } from '@rufieltics/db/domains/internal'
import { PERMISSION_METADATA } from '../decorators/require-permission.decorator'
import type { StaffRequestUser } from './staff-auth.guard'

@Injectable()
export class StaffPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<string>(PERMISSION_METADATA, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!key) return true

    const req = context
      .switchToHttp()
      .getRequest<{ staff?: StaffRequestUser }>()
    if (!req.staff) throw new ForbiddenException('common.errors.forbidden')

    const permissions = await getStaffPermissions(req.staff.id)
    if (!permissions.includes(key)) {
      throw new ForbiddenException({
        message: 'common.errors.forbidden',
        code: 'FORBIDDEN',
      })
    }
    return true
  }
}
