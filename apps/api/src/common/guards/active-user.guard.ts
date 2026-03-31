import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import { JwtService } from '@/modules/jwt/jwt.service'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

interface RequestWithUser {
  user?: CurrentUserPayload
  headers: {
    authorization?: string
  }
}

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const i18n = I18nContext.current(context)
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        i18n?.t('common.errors.unauthorized') || 'Unauthorized'
      )
    }

    const token = authHeader.slice(7)
    const payload = this.jwtService.verifyAccessToken(token)

    request.user = {
      ...payload,
      id: payload.sub,
      isActive: true,
    }

    return true
  }
}
