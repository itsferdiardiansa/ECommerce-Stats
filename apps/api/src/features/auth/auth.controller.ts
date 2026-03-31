import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseGuards,
} from '@nestjs/common'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { I18n, I18nContext } from 'nestjs-i18n'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { created, success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { MyLockoutResponseDto } from './dto/my-lockout-response.dto'
import { RedisService } from '@/modules/redis/redis.service'

const getAuthThrottleConfig = () => ({
  default: {
    limit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5', 10),
    ttl: parseInt(process.env.THROTTLE_AUTH_TTL || '60000', 10),
  },
})

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService
  ) {}

  @Post('register')
  @Throttle(getAuthThrottleConfig())
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @I18n() i18n: I18nContext) {
    const user = await this.authService.register(dto, i18n)
    return created(i18n.t('auth.register.success'), user)
  }

  @Post('verify-email')
  @Throttle(getAuthThrottleConfig())
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.authService.verifyEmail(
      dto,
      i18n,
      ipAddress,
      userAgent
    )
    return success(i18n.t('auth.verify.success'), result)
  }

  @Post('resend-verification')
  @Throttle(getAuthThrottleConfig())
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @I18n() i18n: I18nContext
  ) {
    await this.authService.resendVerification(dto, i18n)
    return success(i18n.t('auth.resend.success'), null)
  }

  @Post('login')
  @Throttle(getAuthThrottleConfig())
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.authService.login(dto, i18n, ipAddress, userAgent)
    return success(i18n.t('auth.login.success'), result)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.authService.refreshToken(
      dto,
      i18n,
      ipAddress,
      userAgent
    )
    return success(i18n.t('auth.refresh.success'), result)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @UseGuards(ActiveUserGuard)
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    await this.authService.logout(user.jti)
    return success(i18n.t('auth.logout.success'), null)
  }

  @Delete('sessions/others')
  @HttpCode(HttpStatus.OK)
  @Throttle(getAuthThrottleConfig())
  @UseGuards(ActiveUserGuard)
  async revokeOtherSessions(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.authService.revokeOtherSessions(
      user.id,
      user.jti,
      i18n
    )
    return success(result.message, null)
  }

  @Get('my-lockout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ActiveUserGuard)
  async getMyLockout(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const lockout = await this.redisService.getVerificationLockout(user.email)

    const response: MyLockoutResponseDto = {
      isLocked: lockout !== null,
      reason: null,
      lockedAt: lockout ? lockout.lockedAt : null,
      expires: lockout ? lockout.expires : null,
      remainingSeconds: lockout ? lockout.ttl : null,
      remainingMinutes: lockout ? Math.ceil(lockout.ttl / 60) : null,
    }

    return success(i18n.t('auth.my_lockout.success'), response)
  }
}
