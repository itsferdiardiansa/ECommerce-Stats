import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { I18nContext } from 'nestjs-i18n'
import { ROLES_KEY } from '@/common/decorators/roles.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

interface RequestWithUser {
  user?: CurrentUserPayload
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user
    const i18n = I18nContext.current(context)

    if (!user) {
      throw new ForbiddenException(
        i18n?.t('common.errors.forbidden') || 'Forbidden'
      )
    }

    if (user.isStaff) return true

    if (!user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        i18n?.t('common.errors.forbidden') || 'Forbidden'
      )
    }

    return true
  }
}
