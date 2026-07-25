import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import { Totp, RecoveryCodes } from '@rufieltics/db/domains/auth'
import {
  getUserCredentials,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import { TotpService } from './totp.service'
import { RedisService } from '@/modules/redis/redis.service'
import { generateRecoveryCode, normalizeRecoveryCode } from '@/utils/auth'
import { generateDeviceFingerprint } from '@/utils/fingerprint'
import {
  AUTH_EVENTS,
  SecurityMethodChangedEvent,
  TwoFactorEnabledEvent,
} from '../events'

@Injectable()
export class MfaService {
  private readonly recoveryCodeCount: number
  private readonly enrolmentTtlSeconds: number

  constructor(
    private readonly totpService: TotpService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    config: ConfigService
  ) {
    this.recoveryCodeCount = config.get<number>(
      'security.totp.recoveryCodeCount',
      10
    )
    this.enrolmentTtlSeconds = config.get<number>(
      'security.totp.enrolmentTtlSeconds',
      900
    )
  }

  async status(userId: number) {
    const [totp, pending, recoveryCodesRemaining] = await Promise.all([
      Totp.findConfirmed(userId),
      this.redisService.getPendingTotp(userId),
      RecoveryCodes.countUnused(userId),
    ])

    return {
      totp: {
        enabled: totp != null,
        pending: totp == null && pending != null,
        confirmedAt: totp?.confirmedAt ?? null,
        lastUsedAt: totp?.lastUsedAt ?? null,
      },
      recoveryCodesRemaining,
    }
  }

  async beginTotpEnrolment(userId: number, i18n: I18nContext) {
    const user = await getUserCredentials(userId)
    if (!user) {
      throw new NotFoundException(i18n.t('users.errors.user_not_found'))
    }

    const existing = await Totp.findConfirmed(userId)
    if (existing) {
      throw new BadRequestException(i18n.t('auth.mfa.already_enabled'))
    }

    const secret = this.totpService.generateSecret()
    await this.redisService.setPendingTotp(
      userId,
      this.totpService.encryptSecret(secret),
      this.enrolmentTtlSeconds
    )

    return {
      secret,
      otpauthUri: this.totpService.buildOtpauthUri(user.email, secret),
    }
  }

  async confirmTotpEnrolment(
    userId: number,
    currentJti: string,
    token: string,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (await Totp.findConfirmed(userId)) {
      throw new BadRequestException(i18n.t('auth.mfa.already_enabled'))
    }

    const encrypted = await this.redisService.getPendingTotp(userId)
    if (!encrypted) {
      throw new BadRequestException(i18n.t('auth.mfa.not_started'))
    }

    const secret = this.totpService.decryptSecret(encrypted)
    if (!(await this.totpService.verifyAndConsume(userId, secret, token))) {
      throw new BadRequestException(i18n.t('auth.mfa.invalid_code'))
    }

    await Totp.enrol(userId, encrypted)
    await this.redisService.deletePendingTotp(userId)
    await updateUser(userId, { isTwoFactorEnabled: true })

    const recoveryCodes = await this.regenerateRecoveryCodes(userId)

    await this.eventEmitter.emitAsync(
      AUTH_EVENTS.TWO_FACTOR_ENABLED,
      new TwoFactorEnabledEvent(userId, currentJti)
    )
    this.emitMethodChange(userId, true, ipAddress, userAgent)

    return { recoveryCodes }
  }

  async disableTotp(
    userId: number,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const record = await Totp.findConfirmed(userId)
    if (!record) {
      throw new NotFoundException(i18n.t('auth.mfa.not_enabled'))
    }

    await Totp.deleteByUser(userId)
    await this.redisService.deletePendingTotp(userId)
    await RecoveryCodes.deleteByUser(userId)
    await updateUser(userId, { isTwoFactorEnabled: false })

    this.emitMethodChange(userId, false, ipAddress, userAgent)
  }

  async regenerateRecoveryCodes(userId: number): Promise<string[]> {
    const codes = Array.from({ length: this.recoveryCodeCount }, () =>
      generateRecoveryCode()
    )
    const hashes = await Promise.all(codes.map(code => argon2.hash(code)))
    await RecoveryCodes.replaceAll(userId, hashes)
    return codes
  }

  async consumeRecoveryCode(userId: number, code: string): Promise<boolean> {
    const normalized = normalizeRecoveryCode(code)
    const candidates = await RecoveryCodes.listUnused(userId)

    for (const candidate of candidates) {
      if (await argon2.verify(candidate.codeHash, normalized)) {
        const { count } = await RecoveryCodes.markUsed(candidate.id)
        return count === 1
      }
    }

    return false
  }

  private emitMethodChange(
    userId: number,
    enabled: boolean,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { geo } = generateDeviceFingerprint(userId, userAgent, ipAddress)
    this.eventEmitter.emit(
      AUTH_EVENTS.SECURITY_METHOD_CHANGED,
      SecurityMethodChangedEvent.from(
        userId,
        'totp',
        enabled,
        geo,
        ipAddress,
        userAgent
      )
    )
  }
}
