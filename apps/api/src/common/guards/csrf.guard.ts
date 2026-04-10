import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { I18nContext } from 'nestjs-i18n'
import type { Request } from 'express'
import { SKIP_CSRF_KEY } from '@/common/decorators/skip-csrf.decorator'

// Double-submit cookie CSRF protection.
// On login/refresh the server sets a non-httpOnly `csrf_token` cookie.
// Every subsequent state-changing request must echo that value in the
// `x-csrf-token` header. An attacker's forged cross-site request cannot
// read the cookie, so the header value won't match.
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skip) return true

    const request = context.switchToHttp().getRequest<Request>()
    const method = request.method.toUpperCase()

    // Only enforce on state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true

    const cookieToken = request.cookies?.csrf_token as string | undefined
    const headerToken = request.headers['x-csrf-token'] as string | undefined

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      const i18n = I18nContext.current(context)
      throw new ForbiddenException(
        i18n?.t('auth.errors.invalid_csrf_token') ?? 'Invalid CSRF token'
      )
    }

    return true
  }
}
