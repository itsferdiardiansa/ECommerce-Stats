import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import { Totp, RecoveryCodes, Passkeys } from '@rufieltics/db/domains/auth'
import {
  getUserCredentials,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { TotpService } from './totp.service'
import { PasskeyService } from './passkey.service'
import { RedisService } from '@/modules/redis/redis.service'
import { generateRecoveryCode, normalizeRecoveryCode } from '@/utils/auth'
import { generateDeviceFingerprint } from '@/utils/fingerprint'
import type { SecurityMethod } from '@/modules/notifications/notification.types'
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
    private readonly passkeyService: PasskeyService,
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
    const [totp, pending, recoveryCodesRemaining, passkeyCount] =
      await Promise.all([
        Totp.findConfirmed(userId),
        this.redisService.getPendingTotp(userId),
        RecoveryCodes.countUnused(userId),
        Passkeys.countByUser(userId),
      ])

    return {
      totp: {
        enabled: totp != null,
        pending: totp == null && pending != null,
        confirmedAt: totp?.confirmedAt ?? null,
        lastUsedAt: totp?.lastUsedAt ?? null,
      },
      passkeys: { enabled: passkeyCount > 0, count: passkeyCount },
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
    this.emitMethodChange(userId, 'totp', true, ipAddress, userAgent)

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
    await this.recomputeTwoFactorEnabled(userId)

    this.emitMethodChange(userId, 'totp', false, ipAddress, userAgent)
  }

  async beginPasskeyEnrolment(userId: number, i18n: I18nContext) {
    return this.passkeyService.beginRegistration(userId, i18n)
  }

  async confirmPasskeyEnrolment(
    userId: number,
    currentJti: string,
    response: RegistrationResponseJSON,
    i18n: I18nContext,
    name?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const firstFactor = (await Passkeys.countByUser(userId)) === 0

    const passkey = await this.passkeyService.finishRegistration(
      userId,
      response,
      i18n,
      name
    )
    await updateUser(userId, { isTwoFactorEnabled: true })

    // The first strong factor added resets the trust boundary, exactly like TOTP.
    if (firstFactor) {
      await this.eventEmitter.emitAsync(
        AUTH_EVENTS.TWO_FACTOR_ENABLED,
        new TwoFactorEnabledEvent(userId, currentJti)
      )
    }
    this.emitMethodChange(userId, 'passkey', true, ipAddress, userAgent)

    return { id: passkey.id, name: passkey.name }
  }

  async listPasskeys(userId: number) {
    return this.passkeyService.list(userId)
  }

  async renamePasskey(
    id: string,
    userId: number,
    name: string,
    i18n: I18nContext
  ) {
    await this.passkeyService.rename(id, userId, name, i18n)
  }

  async removePasskey(
    id: string,
    userId: number,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.passkeyService.remove(id, userId, i18n)
    await this.recomputeTwoFactorEnabled(userId)
    this.emitMethodChange(userId, 'passkey', false, ipAddress, userAgent)
  }

  /** isTwoFactorEnabled reflects "holds at least one strong factor". */
  private async recomputeTwoFactorEnabled(userId: number) {
    const [totp, passkeyCount] = await Promise.all([
      Totp.findConfirmed(userId),
      Passkeys.countByUser(userId),
    ])
    await updateUser(userId, {
      isTwoFactorEnabled: totp != null || passkeyCount > 0,
    })
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
    method: SecurityMethod,
    enabled: boolean,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { geo } = generateDeviceFingerprint(userId, userAgent, ipAddress)
    this.eventEmitter.emit(
      AUTH_EVENTS.SECURITY_METHOD_CHANGED,
      SecurityMethodChangedEvent.from(
        userId,
        method,
        enabled,
        geo,
        ipAddress,
        userAgent
      )
    )
  }
}
