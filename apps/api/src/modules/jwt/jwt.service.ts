import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService as NestJwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { parseExpiresIn } from '@/utils/datetime'

export interface AccessTokenPayload {
  sub: number
  email: string
  isStaff: boolean
  role: string | null
  orgId: string | null
  jti: string
}

@Injectable()
export class JwtService {
  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService
  ) {}

  private get accessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET')
  }

  private get refreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
  }

  getAccessExpiresIn(): number {
    const raw = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '5m')
    return parseExpiresIn(raw)
  }

  getRefreshExpiresIn(): number {
    const raw = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')
    return parseExpiresIn(raw)
  }

  signAccessToken(payload: AccessTokenPayload): string {
    return this.nestJwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.getAccessExpiresIn(),
    })
  }

  signRefreshToken(jti: string): string {
    return this.nestJwtService.sign(
      { jti },
      {
        secret: this.refreshSecret,
        expiresIn: this.getRefreshExpiresIn(),
      }
    )
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.nestJwtService.verify<AccessTokenPayload>(token, {
        secret: this.accessSecret,
      })
    } catch {
      throw new UnauthorizedException()
    }
  }

  verifyRefreshToken(token: string): { jti: string } {
    try {
      return this.nestJwtService.verify<{ jti: string }>(token, {
        secret: this.refreshSecret,
      })
    } catch {
      throw new UnauthorizedException()
    }
  }
}
