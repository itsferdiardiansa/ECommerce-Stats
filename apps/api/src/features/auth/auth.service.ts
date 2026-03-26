import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import {
  createUser,
  getUserByEmail,
  updateUser,
  getUserByEmailIncludingDeleted,
  getUserByUsernameIncludingDeleted,
} from '@rufieltics/db/domains/identity/user'
import { RedisService } from '@/modules/redis/redis.service'
import type { RegisterDto } from './dto/register.dto'
import type { VerifyEmailDto } from './dto/verify-email.dto'
import type { ResendVerificationDto } from './dto/resend-verification.dto'
import type { LoginDto } from './dto/login.dto'
import { formatRemainingTime } from '@/utils/datetime'

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

@Injectable()
export class AuthService {
  constructor(private readonly redisService: RedisService) {}

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
          if (lockout) {
            const remainingTime = lockout.ttl * 1000
            const { minutes, seconds } = formatRemainingTime(remainingTime)
            const messageKey =
              minutes > 0
                ? 'auth.errors.account_locked'
                : 'auth.errors.account_locked_seconds'
            const args = minutes > 0 ? { minutes, seconds } : { seconds }
            throw new BadRequestException(i18n.t(messageKey, { args }))
          }
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

      await this.redisService.setVerificationCode(email, code, 300)

      console.log(`[DEV] Verification code for ${email}: ${code}`)

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
    if (lockout) {
      const remainingTime = lockout.ttl * 1000
      const { minutes, seconds } = formatRemainingTime(remainingTime)
      const messageKey =
        minutes > 0
          ? 'auth.errors.verification_locked'
          : 'auth.errors.verification_locked_seconds'
      const args = minutes > 0 ? { minutes, seconds } : { seconds }
      throw new BadRequestException(i18n.t(messageKey, { args }))
    }

    const storedData = await this.redisService.getVerificationCode(email)

    if (!storedData) {
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    const codeAge = Date.now() - new Date(storedData.createdAt).getTime()
    const maxAge = 5 * 60 * 1000

    if (codeAge > maxAge) {
      await this.redisService.deleteVerificationCode(email)
      throw new BadRequestException(i18n.t('auth.errors.code_expired'))
    }

    if (storedData.attempts >= 5) {
      await this.redisService.setVerificationLockout(
        email,
        3600,
        'TOO_MANY_ATTEMPTS',
        ipAddress,
        userAgent
      )
      await this.redisService.deleteVerificationCode(email)
      throw new BadRequestException(
        i18n.t('auth.errors.too_many_verification_attempts')
      )
    }

    if (storedData.code !== code) {
      const newAttempts =
        await this.redisService.incrementVerificationAttempts(email)
      const remaining = 5 - newAttempts

      if (remaining === 0) {
        throw new BadRequestException(
          i18n.t('auth.errors.too_many_verification_attempts')
        )
      }

      const messageKey =
        remaining === 1
          ? 'auth.errors.invalid_code_last_attempt'
          : 'auth.errors.invalid_code'
      throw new BadRequestException(
        i18n.t(messageKey, { args: { attempts: remaining } })
      )
    }

    const updatedUser = await updateUser(user.id, {
      isActive: true,
      emailVerifiedAt: new Date(),
    })

    await this.redisService.deleteVerificationCode(email)

    return updatedUser
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
    if (lockout) {
      const remainingTime = lockout.ttl * 1000
      const { minutes, seconds } = formatRemainingTime(remainingTime)
      const messageKey =
        minutes > 0
          ? 'auth.errors.account_locked'
          : 'auth.errors.account_locked_seconds'
      const args = minutes > 0 ? { minutes, seconds } : { seconds }
      throw new BadRequestException(i18n.t(messageKey, { args }))
    }

    const existingCode = await this.redisService.getVerificationCode(email)

    if (existingCode) {
      const codeAge = Date.now() - new Date(existingCode.createdAt).getTime()
      const maxAge = 5 * 60 * 1000

      if (codeAge < maxAge) {
        const remainingTime = maxAge - codeAge
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

    await this.redisService.setVerificationCode(email, code, 300)

    console.log(`[DEV] New verification code for ${email}: ${code}`)

    return {
      message: i18n.t('auth.resend.success'),
    }
  }

  async login(data: LoginDto, i18n: I18nContext) {
    const user = await getUserByEmail(data.email)
    if (!user) {
      throw new UnauthorizedException(i18n.t('auth.errors.invalid_credentials'))
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      data.password
    )
    if (!isPasswordValid) {
      throw new UnauthorizedException(i18n.t('auth.errors.invalid_credentials'))
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        i18n.t('auth.errors.account_not_verified')
      )
    }

    throw new BadRequestException(
      'Login not yet fully implemented. JWT and session management required.'
    )
  }

  logout() {
    throw new BadRequestException(
      'Logout not yet implemented. Session management required.'
    )
  }
}
