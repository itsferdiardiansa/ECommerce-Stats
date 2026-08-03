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
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { SudoStore } from '@/modules/redis/stores'
import { TotpService } from './totp.service'
import { PasskeyService } from './passkey.service'

interface SudoInput {
  method: 'password' | 'totp' | 'passkey'
  password?: string
  code?: string
  response?: AuthenticationResponseJSON
}

/** Auth freshness: re-proves identity before a destructive action. */
@Injectable()
export class SudoService {
  private readonly TTL_SECONDS: number
  private readonly MAX_ATTEMPTS: number

  constructor(
    private readonly sudoStore: SudoStore,
    private readonly totpService: TotpService,
    private readonly passkeyService: PasskeyService,
    config: ConfigService
  ) {
    this.TTL_SECONDS = config.get<number>('security.sudo.ttlSeconds', 300)
    this.MAX_ATTEMPTS = config.get<number>('security.sudo.maxAttempts', 5)
  }

  /** Issues passkey assertion options for a pending sudo elevation. */
  async passkeyOptions(userId: number, jti: string) {
    return this.passkeyService.beginAuthentication('sudo', jti, userId)
  }

  async elevate(
    userId: number,
    jti: string,
    deviceKey: string,
    input: SudoInput,
    i18n: I18nContext
  ): Promise<{ expiresIn: number }> {
    const active = await this.sudoStore.getTtl(deviceKey)
    if (active !== null) return { expiresIn: active }

    const attempts = await this.sudoStore.incrementAttempts(
      deviceKey,
      this.TTL_SECONDS
    )

    if (attempts > this.MAX_ATTEMPTS) {
      throw new ForbiddenException(i18n.t('auth.sudo.too_many_attempts'))
    }

    const remaining = Math.max(this.MAX_ATTEMPTS - attempts, 0)
    let passed: boolean
    if (input.method === 'totp') {
      passed = await this.verifyTotp(userId, input.code ?? '')
    } else if (input.method === 'passkey') {
      passed = await this.verifyPasskey(jti, userId, input.response)
    } else {
      passed = await this.verifyPassword(userId, input.password ?? '', i18n)
    }

    if (!passed) {
      throw new UnauthorizedException(
        i18n.t(this.invalidKey(input.method), { args: { attempts: remaining } })
      )
    }

    await this.sudoStore.grant(deviceKey, this.TTL_SECONDS)

    return { expiresIn: this.TTL_SECONDS }
  }

  private invalidKey(method: SudoInput['method']): string {
    if (method === 'totp') return 'auth.sudo.invalid_code'
    if (method === 'passkey') return 'auth.sudo.invalid_passkey'
    return 'auth.sudo.invalid_password'
  }

  private async verifyPasskey(
    jti: string,
    userId: number,
    response?: AuthenticationResponseJSON
  ): Promise<boolean> {
    if (!response) return false
    const verified = await this.passkeyService.finishAuthentication(
      'sudo',
      jti,
      response
    )
    return verified === userId
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
    if (!user.passwordHash) return false
    return argon2.verify(user.passwordHash, password)
  }

  private async verifyTotp(userId: number, code: string): Promise<boolean> {
    const record = await Totp.findConfirmed(userId)
    if (!record) return false

    const secret = this.totpService.decryptSecret(record.secret)
    return this.totpService.verifyAndConsume(userId, secret, code)
  }

  async status(
    deviceKey: string
  ): Promise<{ active: boolean; expiresIn: number }> {
    const ttl = await this.sudoStore.getTtl(deviceKey)
    return { active: ttl !== null, expiresIn: ttl ?? 0 }
  }
}
