import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

interface RequestWithUser {
  user?: CurrentUserPayload
  headers: {
    authorization?: string
  }
}

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const i18n = I18nContext.current(context)
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        i18n?.t('common.errors.unauthorized') || 'Unauthorized'
      )
    }

    request.user = {
      id: 1,
      email: 'test@example.com',
      isStaff: true,
      isActive: true,
    }

    return true
  }
}
