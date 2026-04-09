import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import { createHash } from 'crypto'
import { JwtService } from '@/modules/jwt/jwt.service'
import { TokenDenylistService } from '@/modules/jwt/token-denylist.service'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { generateDeviceFingerprint } from '@/utils/fingerprint'

interface RequestWithUser {
  user?: CurrentUserPayload
  headers: {
    authorization?: string
    'x-device-secret'?: string
    'user-agent'?: string
  }
  cookies?: Record<string, string>
  ip?: string
}

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenDenylist: TokenDenylistService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    const isDenied = await this.tokenDenylist.isDenied(payload.jti)

    if (isDenied) {
      throw new UnauthorizedException(
        i18n?.t('common.errors.unauthorized') || 'Unauthorized'
      )
    }

    const rawDeviceSecret =
      request.cookies?.deviceSecret || request.headers['x-device-secret']

    if (!rawDeviceSecret) {
      throw new UnauthorizedException(
        i18n?.t('auth.errors.missing_device_secret') ||
          'Missing device binding credentials'
      )
    }

    const incomingHash = createHash('sha256')
      .update(rawDeviceSecret)
      .digest('hex')

    if (incomingHash !== payload.fph) {
      throw new UnauthorizedException(
        i18n?.t('auth.errors.token_binding_failed') ||
          'Token binding validation failed'
      )
    }

    const userAgent = request.headers['user-agent']
    const ipAddress = request.ip || ''

    if (!userAgent) {
      throw new UnauthorizedException(
        i18n?.t('auth.errors.invalid_client') || 'Invalid client'
      )
    }

    const { hash: currentEnvHash } = generateDeviceFingerprint(
      payload.sub,
      userAgent,
      ipAddress
    )

    if (currentEnvHash !== payload.env) {
      throw new UnauthorizedException(
        i18n?.t('auth.errors.invalid_client') ||
          'Token binding environment mismatch'
      )
    }

    request.user = {
      ...payload,
      id: payload.sub,
      isActive: true,
    }

    return true
  }
}
