import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService as NestJwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

export interface AccessTokenPayload {
  sub: number
  email: string
  isStaff: boolean
  role: string | null
  orgId: string | null
  jti: string
}

const REFRESH_EXPIRES_SECONDS = 7 * 24 * 3600

function parseExpiresIn(raw: string): number {
  const match = raw.match(/^(\d+)([smhd])$/)
  if (!match) return 900
  const value = parseInt(match[1], 10)
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
  return value * (multipliers[match[2]] ?? 60)
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
    const raw = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m')
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
        expiresIn: REFRESH_EXPIRES_SECONDS,
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
