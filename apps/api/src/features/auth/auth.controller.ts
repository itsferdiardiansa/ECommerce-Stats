import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseGuards,
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'
import { LoginDto } from './dto/login.dto'
import { created, success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { MyLockoutResponseDto } from './dto/my-lockout-response.dto'
import { RedisService } from '@/modules/redis/redis.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @I18n() i18n: I18nContext) {
    const user = await this.authService.register(dto, i18n)
    return created(i18n.t('auth.register.success'), user)
  }

  @Post('verify-email')
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
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @I18n() i18n: I18nContext
  ) {
    await this.authService.resendVerification(dto, i18n)
    return success(i18n.t('auth.resend.success'), null)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @I18n() i18n: I18nContext) {
    const result = await this.authService.login(dto, i18n)
    return success(i18n.t('auth.login.success'), result)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@I18n() i18n: I18nContext) {
    return success(i18n.t('auth.logout.success'), null)
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
