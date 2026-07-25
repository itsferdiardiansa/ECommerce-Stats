import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import {
  createUser,
  getUserByEmail,
  updateUser,
  getUserByEmailIncludingDeleted,
  getUserByUsernameIncludingDeleted,
} from '@rufieltics/db/domains/identity/user'
import {
  Organizations,
  OrganizationMembers,
} from '@rufieltics/db/domains/identity/organization'
import { RedisService } from '@/modules/redis/redis.service'
import { MailQueueService } from '@/modules/mail/mail-queue.service'
import { MailPriority } from '@/modules/mail/mail.constants'
import { renderEmail } from '@rufieltics/emails'
import { formatRemainingTime } from '@/utils/datetime'
import { generateVerificationCode, generateOrgSlug } from '@/utils/auth'
import type { RegisterDto } from '../dto/register.dto'
import type { VerifyEmailDto } from '../dto/verify-email.dto'
import type { ResendVerificationDto } from '../dto/resend-verification.dto'

@Injectable()
export class RegistrationService {
  private readonly codeTtlSeconds: number
  private readonly codeMaxAgeMs: number
  private readonly maxAttempts: number
  private readonly lockoutSeconds: number

  constructor(
    private readonly redisService: RedisService,
    private readonly mailQueue: MailQueueService,
    config: ConfigService
  ) {
    this.codeTtlSeconds = config.get<number>(
      'security.verification.codeTtlSeconds',
      300
    )
    this.codeMaxAgeMs = this.codeTtlSeconds * 1000
    this.maxAttempts = config.get<number>(
      'security.verification.maxAttempts',
      5
    )
    this.lockoutSeconds = config.get<number>(
      'security.verification.lockoutSeconds',
      3600
    )
  }

  private lockoutException(
    ttlSeconds: number,
    i18n: I18nContext
  ): BadRequestException {
    const { minutes, seconds } = formatRemainingTime(ttlSeconds * 1000)
    const messageKey =
      minutes > 0
        ? 'auth.errors.account_locked'
        : 'auth.errors.account_locked_seconds'
    const args = minutes > 0 ? { minutes, seconds } : { seconds }
    return new BadRequestException(i18n.t(messageKey, { args }))
  }

  private assertNotLockedOut(
    lockout: { ttl: number } | null,
    i18n: I18nContext
  ): void {
    if (!lockout) return
    throw this.lockoutException(lockout.ttl, i18n)
  }

  private async triggerVerificationLockout(
    email: string,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<never> {
    await this.redisService.setVerificationLockout(
      email,
      this.lockoutSeconds,
      'TOO_MANY_ATTEMPTS',
      ipAddress,
      userAgent
    )
    await this.redisService.deleteVerificationCode(email)
    throw this.lockoutException(this.lockoutSeconds, i18n)
  }

  private async sendVerificationEmail(
    to: string,
    name: string,
    code: string,
    i18n: I18nContext
  ): Promise<void> {
    const message = await renderEmail('verification-code', i18n.lang, {
      name,
      code,
      minutes: Math.round(this.codeTtlSeconds / 60),
    })
    await this.mailQueue.enqueue(
      { to, ...message },
      { priority: MailPriority.HIGH }
    )
  }

  async register(data: RegisterDto, i18n: I18nContext) {
    try {
      const { password, ...rest } = data
      const { email, username } = data

      const existingUserByEmail = await getUserByEmailIncludingDeleted(email)
      if (existingUserByEmail) {
        if (existingUserByEmail.deletedAt) {
          throw new BadRequestException(
            i18n.t('auth.errors.email_already_exists_deleted')
          )
        }

        const fullUser = await getUserByEmail(email)
        if (fullUser && !fullUser.isActive && !fullUser.emailVerifiedAt) {
          const lockout = await this.redisService.getVerificationLockout(email)
          this.assertNotLockedOut(lockout, i18n)
        }

        throw new BadRequestException(
          i18n.t('auth.errors.email_already_exists')
        )
      }

      const existingUserByUsername =
        await getUserByUsernameIncludingDeleted(username)
      if (existingUserByUsername) {
        if (existingUserByUsername.deletedAt) {
          throw new BadRequestException(
            i18n.t('auth.errors.username_already_exists_deleted')
          )
        }
        throw new BadRequestException(
          i18n.t('auth.errors.username_already_exists')
        )
      }

      const passwordHash = await argon2.hash(password)

      const user = await createUser({
        ...rest,
        passwordHash,
        isActive: false,
      })

      const code = generateVerificationCode()
      await this.redisService.setVerificationCode(
        email,
        code,
        this.codeTtlSeconds
      )

      await this.sendVerificationEmail(email, user.name, code, i18n)

      return user
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err
      }
      throw new BadRequestException((err as Error).message)
    }
  }

  async verifyEmail(
    data: VerifyEmailDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { email, code } = data

    const user = await getUserByEmail(email)
    if (!user) {
      throw new NotFoundException(i18n.t('auth.errors.user_not_found'))
    }

    if (user.isActive && user.emailVerifiedAt) {
      throw new BadRequestException(i18n.t('auth.errors.already_verified'))
    }

    const lockout = await this.redisService.getVerificationLockout(email)
    this.assertNotLockedOut(lockout, i18n)

    const storedData = await this.redisService.getVerificationCode(email)

    if (!storedData) {
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    const codeAge = Date.now() - new Date(storedData.createdAt).getTime()

    if (codeAge > this.codeMaxAgeMs) {
      await this.redisService.deleteVerificationCode(email)
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    const attemptNo =
      await this.redisService.incrementVerificationAttempts(email)

    if (attemptNo > this.maxAttempts) {
      await this.triggerVerificationLockout(email, i18n, ipAddress, userAgent)
    }

    if (storedData.code !== code) {
      const remaining = this.maxAttempts - attemptNo

      if (remaining <= 0) {
        await this.triggerVerificationLockout(email, i18n, ipAddress, userAgent)
      }

      const messageKey =
        remaining === 1
          ? 'auth.errors.invalid_code_last_attempt'
          : 'auth.errors.invalid_code'
      throw new BadRequestException(
        i18n.t(messageKey, { args: { attempts: remaining } })
      )
    }

    const [updatedUser] = await Promise.all([
      updateUser(user.id, {
        isActive: true,
        emailVerifiedAt: new Date(),
      }),
      this.redisService.deleteVerificationCode(email),
      this.provisionPersonalWorkspace(user.id, user.name, user.username),
    ])

    return updatedUser
  }

  private async provisionPersonalWorkspace(
    userId: number,
    name: string,
    username: string
  ) {
    const existing = await OrganizationMembers.listByUser(userId)
    if (existing.length > 0) return

    const org = await Organizations.create({
      name: `${name}'s Workspace`,
      slug: generateOrgSlug(username),
    })

    await OrganizationMembers.addMember({
      organizationId: org.id,
      userId,
      role: 'OWNER',
    })
  }

  async resendVerification(data: ResendVerificationDto, i18n: I18nContext) {
    const { email } = data

    const user = await getUserByEmail(email)
    if (!user) {
      throw new NotFoundException(i18n.t('auth.errors.user_not_found'))
    }

    if (user.isActive && user.emailVerifiedAt) {
      throw new BadRequestException(i18n.t('auth.errors.already_verified'))
    }

    const lockout = await this.redisService.getVerificationLockout(email)
    this.assertNotLockedOut(lockout, i18n)

    const existingCode = await this.redisService.getVerificationCode(email)

    if (existingCode) {
      const codeAge = Date.now() - new Date(existingCode.createdAt).getTime()

      if (codeAge < this.codeMaxAgeMs) {
        const remainingTime = this.codeMaxAgeMs - codeAge
        const { minutes, seconds } = formatRemainingTime(remainingTime)
        const messageKey =
          minutes > 0
            ? 'auth.errors.code_still_valid'
            : 'auth.errors.code_still_valid_seconds'
        const args = minutes > 0 ? { minutes, seconds } : { seconds }
        throw new BadRequestException(i18n.t(messageKey, { args }))
      }
    }

    const code = generateVerificationCode()
    await this.redisService.setVerificationCode(
      email,
      code,
      this.codeTtlSeconds
    )

    await this.sendVerificationEmail(email, user.name, code, i18n)

    return {
      message: i18n.t('auth.resend.success'),
    }
  }
}
