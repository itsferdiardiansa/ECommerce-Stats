import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import {
  getUserByEmail,
  getUserCredentials,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import { renderEmail } from '@rufieltics/emails'
import { EmailChangeStore } from '@/modules/redis/stores'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import { MailPriority } from '@/modules/mail/mail.constants'
import { generateVerificationCode } from '@/utils/auth'

@Injectable()
export class EmailChangeService {
  private readonly codeTtlSeconds: number
  private readonly maxAttempts: number

  constructor(
    private readonly emailChangeStore: EmailChangeStore,
    private readonly mailQueue: MailQueueService,
    config: ConfigService
  ) {
    this.codeTtlSeconds = config.get<number>(
      'security.emailChange.codeTtlSeconds',
      900
    )
    this.maxAttempts = config.get<number>('security.emailChange.maxAttempts', 5)
  }

  async requestChange(
    userId: number,
    rawNewEmail: string,
    i18n: I18nContext
  ): Promise<void> {
    const newEmail = rawNewEmail.toLowerCase()
    const user = await getUserCredentials(userId)
    if (!user) {
      throw new NotFoundException(i18n.t('auth.errors.user_not_found'))
    }
    if (user.email.toLowerCase() === newEmail) {
      throw new BadRequestException(i18n.t('auth.errors.email_taken'))
    }
    const taken = await getUserByEmail(newEmail)
    if (taken) {
      throw new BadRequestException(i18n.t('auth.errors.email_taken'))
    }

    const code = generateVerificationCode()
    await this.emailChangeStore.setCode(
      userId,
      newEmail,
      code,
      this.codeTtlSeconds
    )

    const message = await renderEmail('email-change', i18n.lang, {
      name: user.name,
      code,
      minutes: Math.round(this.codeTtlSeconds / 60),
    })
    await this.mailQueue.enqueue(
      { to: newEmail, ...message },
      { priority: MailPriority.HIGH }
    )
  }

  async confirmChange(
    userId: number,
    code: string,
    i18n: I18nContext
  ): Promise<{ email: string }> {
    const stored = await this.emailChangeStore.getCode(userId)
    if (!stored) {
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    const attemptNo = await this.emailChangeStore.incrementAttempts(userId)
    if (attemptNo > this.maxAttempts) {
      await this.emailChangeStore.deleteCode(userId)
      throw new BadRequestException(i18n.t('auth.errors.too_many_attempts'))
    }

    if (stored.code !== code) {
      const remaining = this.maxAttempts - attemptNo
      throw new BadRequestException(
        i18n.t('auth.errors.invalid_code', { args: { attempts: remaining } })
      )
    }

    const taken = await getUserByEmail(stored.newEmail)
    if (taken && taken.id !== userId) {
      await this.emailChangeStore.deleteCode(userId)
      throw new BadRequestException(i18n.t('auth.errors.email_taken'))
    }

    await updateUser(userId, {
      email: stored.newEmail,
      emailVerifiedAt: new Date(),
    })
    await this.emailChangeStore.deleteCode(userId)

    return { email: stored.newEmail }
  }
}
