import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import { getUserCredentials } from '@rufieltics/db/domains/identity/user'
import { Totp } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { TotpService } from './totp.service'

/** Auth freshness: re-proves identity before a destructive action. */
@Injectable()
export class SudoService {
  private readonly TTL_SECONDS: number
  private readonly MAX_ATTEMPTS: number

  constructor(
    private readonly redisService: RedisService,
    private readonly totpService: TotpService,
    config: ConfigService
  ) {
    this.TTL_SECONDS = config.get<number>('security.sudo.ttlSeconds', 300)
    this.MAX_ATTEMPTS = config.get<number>('security.sudo.maxAttempts', 5)
  }

  async elevate(
    userId: number,
    jti: string,
    input: { method: 'password' | 'totp'; password?: string; code?: string },
    i18n: I18nContext
  ): Promise<{ expiresIn: number }> {
    const active = await this.redisService.getSudoTtl(jti)
    if (active !== null) return { expiresIn: active }

    const attempts = await this.redisService.incrementSudoAttempts(
      jti,
      this.TTL_SECONDS
    )

    if (attempts > this.MAX_ATTEMPTS) {
      throw new ForbiddenException(i18n.t('auth.sudo.too_many_attempts'))
    }

    const remaining = Math.max(this.MAX_ATTEMPTS - attempts, 0)
    const passed =
      input.method === 'totp'
        ? await this.verifyTotp(userId, input.code ?? '')
        : await this.verifyPassword(userId, input.password ?? '', i18n)

    if (!passed) {
      throw new UnauthorizedException(
        i18n.t(
          input.method === 'totp'
            ? 'auth.sudo.invalid_code'
            : 'auth.sudo.invalid_password',
          { args: { attempts: remaining } }
        )
      )
    }

    await this.redisService.grantSudo(jti, this.TTL_SECONDS)

    return { expiresIn: this.TTL_SECONDS }
  }

  private async verifyPassword(
    userId: number,
    password: string,
    i18n: I18nContext
  ): Promise<boolean> {
    const user = await getUserCredentials(userId)
    if (!user) {
      throw new UnauthorizedException(i18n.t('common.errors.unauthorized'))
    }
    return argon2.verify(user.passwordHash, password)
  }

  private async verifyTotp(userId: number, code: string): Promise<boolean> {
    const record = await Totp.findConfirmed(userId)
    if (!record) return false

    const secret = this.totpService.decryptSecret(record.secret)
    return this.totpService.verifyAndConsume(userId, secret, code)
  }

  async status(jti: string): Promise<{ active: boolean; expiresIn: number }> {
    const ttl = await this.redisService.getSudoTtl(jti)
    return { active: ttl !== null, expiresIn: ttl ?? 0 }
  }
}
