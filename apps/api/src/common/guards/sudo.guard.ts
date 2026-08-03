import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { I18nContext } from 'nestjs-i18n'
import { REQUIRE_SUDO_KEY } from '@/common/decorators/require-sudo.decorator'
import { SudoStore } from '@/modules/redis/stores'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

interface RequestWithUser {
  user?: CurrentUserPayload
}

/** Requires recent re-authentication on `@RequireSudo()` routes. */
@Injectable()
export class SudoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sudoStore: SudoStore
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SUDO_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!required) return true

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const i18n = I18nContext.current(context)
    const deviceKey = request.user?.fph

    if (!deviceKey || (await this.sudoStore.getTtl(deviceKey)) === null) {
      throw new ForbiddenException({
        message: i18n?.t('auth.sudo.required') || 'Re-authentication required',
        code: 'SUDO_REQUIRED',
      })
    }

    return true
  }
}
