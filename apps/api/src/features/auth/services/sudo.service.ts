import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import { getUserCredentials } from '@rufieltics/db/domains/identity/user'
import { RedisService } from '@/modules/redis/redis.service'

/** Auth freshness: re-proves identity before a destructive action. */
@Injectable()
export class SudoService {
  private readonly TTL_SECONDS: number
  private readonly MAX_ATTEMPTS: number

  constructor(
    private readonly redisService: RedisService,
    config: ConfigService
  ) {
    this.TTL_SECONDS = config.get<number>('security.sudo.ttlSeconds', 300)
    this.MAX_ATTEMPTS = config.get<number>('security.sudo.maxAttempts', 5)
  }

  async elevate(
    userId: number,
    jti: string,
    password: string,
    i18n: I18nContext
  ): Promise<{ expiresIn: number }> {
    const attempts = await this.redisService.incrementSudoAttempts(
      jti,
      this.TTL_SECONDS
    )

    if (attempts > this.MAX_ATTEMPTS) {
      throw new ForbiddenException(i18n.t('auth.sudo.too_many_attempts'))
    }

    const user = await getUserCredentials(userId)
    if (!user) {
      throw new UnauthorizedException(i18n.t('common.errors.unauthorized'))
    }

    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException(
        i18n.t('auth.sudo.invalid_password', {
          args: { attempts: Math.max(this.MAX_ATTEMPTS - attempts, 0) },
        })
      )
    }

    await this.redisService.grantSudo(jti, this.TTL_SECONDS)

    return { expiresIn: this.TTL_SECONDS }
  }

  async status(jti: string): Promise<{ active: boolean; expiresIn: number }> {
    const ttl = await this.redisService.getSudoTtl(jti)
    return { active: ttl !== null, expiresIn: ttl ?? 0 }
  }
}
