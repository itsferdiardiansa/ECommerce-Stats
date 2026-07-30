import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import {
  getUserByEmail,
  getUserCredentials,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import { PasswordSecurity } from '@rufieltics/db/domains/auth'
import { renderEmail } from '@rufieltics/emails'
import { AuthService } from '../auth.service'
import { PasswordResetStore } from '@/modules/redis/stores'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import { MailPriority } from '@/modules/mail/mail.constants'
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '@/utils/auth'
import { AUTH_EVENTS, PasswordChangedEvent } from '../events'

@Injectable()
export class PasswordResetService {
  private readonly ttlSeconds: number
  private readonly resetUrl: string

  constructor(
    private readonly resetStore: PasswordResetStore,
    private readonly mailQueue: MailQueueService,
    private readonly authService: AuthService,
    private readonly eventEmitter: EventEmitter2,
    config: ConfigService
  ) {
    this.ttlSeconds = config.get<number>(
      'security.passwordReset.codeTtlSeconds',
      900
    )
    this.resetUrl = config.get<string>(
      'security.passwordReset.resetUrl',
      'http://localhost:3000/reset-password'
    )
  }

  private resendCooldownSeconds(count: number): number {
    if (count <= 3) return 60
    if (count <= 5) return 300
    if (count <= 7) return 1800
    if (count <= 9) return 7200
    if (count <= 11) return 43200
    return 86400
  }

  async forgotPassword(
    email: string,
    i18n: I18nContext
  ): Promise<{ retryAfterSeconds: number; throttled: boolean }> {
    const active = await this.resetStore.getResendCooldown(email)
    if (active > 0) {
      return { retryAfterSeconds: active, throttled: true }
    }

    const count = await this.resetStore.incrementResendCount(email)
    const cooldown = this.resendCooldownSeconds(count)
    await this.resetStore.setResendCooldown(email, cooldown)

    const user = await getUserByEmail(email)
    if (user) {
      const { token, tokenHash } = generatePasswordResetToken()
      await this.resetStore.issue(user.id, tokenHash, this.ttlSeconds)
      const url = `${this.resetUrl}?token=${encodeURIComponent(token)}`
      const message = await renderEmail('password-reset', i18n.lang, {
        name: user.name,
        url,
        minutes: Math.round(this.ttlSeconds / 60),
      })
      await this.mailQueue.enqueue(
        { to: email, ...message },
        { priority: MailPriority.HIGH }
      )
    }

    return { retryAfterSeconds: cooldown, throttled: false }
  }

  /** Non-consuming validity check for the reset page's load-time UX. */
  async verifyToken(token: string): Promise<boolean> {
    const stored = await this.resetStore.get(hashPasswordResetToken(token))
    return stored !== null
  }

  async resetPassword(
    token: string,
    newPassword: string,
    i18n: I18nContext
  ): Promise<void> {
    const tokenHash = hashPasswordResetToken(token)
    const stored = await this.resetStore.get(tokenHash)
    if (!stored) {
      throw new BadRequestException(i18n.t('auth.errors.reset_token_invalid'))
    }

    const user = await getUserCredentials(stored.userId)
    if (!user) {
      await this.resetStore.clear(stored.userId, tokenHash)
      throw new BadRequestException(i18n.t('auth.errors.reset_token_invalid'))
    }

    if (
      user.passwordHash &&
      (await argon2.verify(user.passwordHash, newPassword))
    ) {
      throw new BadRequestException(i18n.t('auth.errors.password_reused'))
    }
    const recent = await PasswordSecurity.getRecentPasswords(user.id)
    for (const { password } of recent) {
      if (await argon2.verify(password, newPassword)) {
        throw new BadRequestException(i18n.t('auth.errors.password_reused'))
      }
    }

    if (user.passwordHash) {
      await PasswordSecurity.archivePassword(user.id, user.passwordHash)
    }

    await updateUser(user.id, {
      passwordHash: await argon2.hash(newPassword),
      passwordChangedAt: new Date(),
    })
    await this.resetStore.clear(stored.userId, tokenHash)
    await this.authService.revokeAllSessions(user.id)

    this.eventEmitter.emit(
      AUTH_EVENTS.PASSWORD_CHANGED,
      new PasswordChangedEvent(user.id, null, null, null)
    )
  }
}
