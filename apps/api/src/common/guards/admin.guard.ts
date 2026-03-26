import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

interface RequestWithUser {
  user?: CurrentUserPayload
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user
    const i18n = I18nContext.current(context)

    if (!user) {
      throw new ForbiddenException(
        i18n?.t('common.errors.forbidden') || 'Forbidden'
      )
    }

    if (!user.isStaff) {
      throw new ForbiddenException(
        i18n?.t('common.errors.admin_only') || 'Admin privileges required'
      )
    }

    return true
  }
}
