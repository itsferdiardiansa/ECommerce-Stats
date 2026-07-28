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
  }

  /** Enumeration-safe: always resolves the same way whether or not the email exists. */
  async forgotPassword(email: string, i18n: I18nContext): Promise<void> {
    const user = await getUserByEmail(email)
    if (user) {
      const { token, tokenHash } = generatePasswordResetToken()
      await this.resetStore.set(tokenHash, user.id, this.ttlSeconds)
      const message = await renderEmail('password-reset', i18n.lang, {
        name: user.name,
        code: token,
        minutes: Math.round(this.ttlSeconds / 60),
      })
      await this.mailQueue.enqueue(
        { to: email, ...message },
        { priority: MailPriority.HIGH }
      )
    }
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
      await this.resetStore.delete(tokenHash)
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
    await this.resetStore.delete(tokenHash)
    await this.authService.revokeAllSessions(user.id)

    this.eventEmitter.emit(
      AUTH_EVENTS.PASSWORD_CHANGED,
      new PasswordChangedEvent(user.id, null, null, null)
    )
  }
}
