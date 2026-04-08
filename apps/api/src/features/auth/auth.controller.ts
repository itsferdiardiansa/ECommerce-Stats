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
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request, Response, CookieOptions } from 'express'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { I18n, I18nContext } from 'nestjs-i18n'
import { AuthService } from './auth.service'
import { SessionService } from './session.service'
import { RegisterDto } from './dto/register.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'
import { LoginDto } from './dto/login.dto'
import { RevokeSessionsDto } from './dto/revoke-sessions.dto'
import { created, success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { MyLockoutResponseDto } from './dto/my-lockout-response.dto'
import { RedisService } from '@/modules/redis/redis.service'
import { JwtService } from '@/modules/jwt/jwt.service'
import configuration from '@/config/configuration'

const config = configuration()

const getAuthThrottleConfig = () => ({
  default: {
    limit: config.throttle.auth.limit,
    ttl: config.throttle.auth.ttl,
  },
})

@Controller('auth')
export class AuthController {
  private readonly AUTH_COOKIE_PATH = '/api/v1/auth'

  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService
  ) {}

  private getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      path: this.AUTH_COOKIE_PATH,
      maxAge: this.jwtService.getRefreshExpiresIn() * 1000,
    }
  }

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
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const { refreshToken, rawDeviceSecret, ...result } =
      await this.authService.login(dto, i18n, ipAddress, userAgent)

    res.cookie('refreshToken', refreshToken, this.getCookieOptions())
    res.cookie('deviceSecret', rawDeviceSecret, this.getCookieOptions())

    return success(i18n.t('auth.login.success'), result)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = req.cookies?.refreshToken as string | undefined

    if (!token) {
      throw new UnauthorizedException(
        i18n.t('auth.errors.invalid_refresh_token')
      )
    }

    const { refreshToken, rawDeviceSecret, ...result } =
      await this.authService.refreshToken(
        { refreshToken: token },
        i18n,
        ipAddress,
        userAgent
      )

    res.cookie('refreshToken', refreshToken, this.getCookieOptions())
    res.cookie('deviceSecret', rawDeviceSecret, this.getCookieOptions())

    return success(i18n.t('auth.refresh.success'), result)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @UseGuards(ActiveUserGuard)
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.sessionService.logout(user.jti)
    res.clearCookie('refreshToken', { path: this.AUTH_COOKIE_PATH })
    res.clearCookie('deviceSecret', { path: this.AUTH_COOKIE_PATH })
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
    const result = await this.sessionService.revokeOtherSessions(
      user.id,
      user.jti,
      i18n
    )
    return success(result.message, null)
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ActiveUserGuard)
  async getSessions(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.sessionService.getActiveSessions(
      user.id,
      user.jti,
      i18n
    )
    return success(result.message, result.data)
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @Throttle(getAuthThrottleConfig())
  @UseGuards(ActiveUserGuard)
  async revokeSessions(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RevokeSessionsDto,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.sessionService.revokeSessions(
      user.id,
      dto.jtis,
      i18n
    )

    if (dto.jtis.includes(user.jti)) {
      res.clearCookie('refreshToken', { path: this.AUTH_COOKIE_PATH })
      res.clearCookie('deviceSecret', { path: this.AUTH_COOKIE_PATH })
    }

    return success(result.message, null)
  }

  @Get('my-lockout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ActiveUserGuard)
  async getMyLockout(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const lockout = await this.authService.getVerificationLockout(user.email)

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
