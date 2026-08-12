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
  Param,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request, Response, CookieOptions } from 'express'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { I18n, I18nContext } from 'nestjs-i18n'
import { AuthService } from './auth.service'
import { TrustedDeviceService } from './services/trusted-device.service'
import { RegistrationService } from './services/registration.service'
import { LoginService } from './services/login.service'
import { StepUpService } from './services/step-up.service'
import { RegisterDto } from './dto/register.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'
import { LoginDto } from './dto/login.dto'
import { StepUpDto, VerifyStepUpChallengeDto } from './dto/step-up.dto'
import { PasskeyOptionsDto, VerifyPasskeyLoginDto } from './dto/passkey.dto'
import { PasswordlessAuthDto } from './dto/passwordless.dto'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { RevokeSessionsDto } from './dto/revoke-sessions.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { created, success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { SudoGuard } from '@/common/guards/sudo.guard'
import { CaptchaGuard } from '@/common/guards/captcha.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { RequireSudo } from '@/common/decorators/require-sudo.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { MyLockoutResponseDto } from './dto/my-lockout-response.dto'
import { getProfile } from '@rufieltics/db/domains/identity/user'
import { OrganizationMembers } from '@rufieltics/db/domains/identity/organization'
import { VerificationStore } from '@/modules/redis/stores'
import { JwtService } from '@/modules/jwt/jwt.service'
import configuration from '@/config/configuration'
import {
  authThrottle,
  passkeyThrottle,
  stepUpThrottle,
} from '@/common/helpers/throttle.helper'

const config = configuration()

@Controller('auth')
export class AuthController {
  private readonly AUTH_COOKIE_PATH = '/api/v1/auth'
  private readonly DEVICE_COOKIE_PATH = '/api/v1'

  constructor(
    private readonly authService: AuthService,
    private readonly registration: RegistrationService,
    private readonly loginService: LoginService,
    private readonly stepUpService: StepUpService,
    private readonly trustedDevices: TrustedDeviceService,
    private readonly verificationStore: VerificationStore,
    private readonly jwtService: JwtService
  ) {}

  private getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
      path: this.AUTH_COOKIE_PATH,
      maxAge: this.jwtService.getRefreshExpiresIn() * 1000,
    }
  }

  private getDeviceCookieOptions(): CookieOptions {
    return {
      ...this.getCookieOptions(),
      path: this.DEVICE_COOKIE_PATH,
    }
  }

  private getTrustedCookieOptions(ttlSeconds: number): CookieOptions {
    return {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
      path: this.AUTH_COOKIE_PATH,
      maxAge: ttlSeconds * 1000,
    }
  }

  @Post('register')
  @Throttle(authThrottle())
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @I18n() i18n: I18nContext) {
    const user = await this.registration.register(dto, i18n)
    return created(i18n.t('auth.register.success'), user)
  }

  @Post('verify-email')
  @Throttle(authThrottle())
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.registration.verifyEmail(
      dto,
      i18n,
      ipAddress,
      userAgent
    )
    return success(i18n.t('auth.verify.success'), result)
  }

  @Post('resend-verification')
  @Throttle(authThrottle())
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @I18n() i18n: I18nContext
  ) {
    await this.registration.resendVerification(dto, i18n)
    return success(i18n.t('auth.resend.success'), null)
  }

  @Post('login')
  @Throttle(authThrottle())
  @UseGuards(CaptchaGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const trustedDeviceToken = req.cookies?.trustedDevice as string | undefined
    const loginResult = await this.loginService.login(
      dto,
      i18n,
      ipAddress,
      userAgent,
      trustedDeviceToken,
      req.cookies?.deviceSecret as string | undefined
    )

    if ('stepUpRequired' in loginResult) {
      const messageKey =
        loginResult.method === 'totp'
          ? 'auth.login.step_up_required_totp'
          : 'auth.login.step_up_required'
      return success(i18n.t(messageKey), {
        stepUpRequired: true,
        challengeId: loginResult.challengeId,
        method: loginResult.method,
        availableMethods: loginResult.availableMethods,
      })
    }

    const { refreshToken, rawDeviceSecret, ...result } = loginResult

    res.cookie('refreshToken', refreshToken, this.getCookieOptions())
    res.cookie('deviceSecret', rawDeviceSecret, this.getDeviceCookieOptions())

    return success(i18n.t('auth.login.success'), result)
  }

  @Post('login/step-up/verify')
  @Throttle(authThrottle())
  @HttpCode(HttpStatus.OK)
  async verifyStepUpChallenge(
    @Body() dto: VerifyStepUpChallengeDto,
    @I18n() i18n: I18nContext
  ) {
    const valid = await this.stepUpService.challengeExists(dto.challengeId)
    return success(i18n.t('auth.step_up.challenge_checked'), { valid })
  }

  @Post('login/step-up')
  @Throttle(stepUpThrottle())
  @HttpCode(HttpStatus.OK)
  async stepUp(
    @Body() dto: StepUpDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const {
      refreshToken,
      rawDeviceSecret,
      trustedDeviceToken,
      trustedDeviceTtl,
      ...result
    } = await this.stepUpService.verifyStepUp(
      dto.challengeId,
      dto.code,
      dto.method,
      i18n,
      ipAddress,
      userAgent,
      dto.trustDevice,
      req.cookies?.deviceSecret as string | undefined
    )

    res.cookie('refreshToken', refreshToken, this.getCookieOptions())
    res.cookie('deviceSecret', rawDeviceSecret, this.getDeviceCookieOptions())
    if (trustedDeviceToken) {
      res.cookie(
        'trustedDevice',
        trustedDeviceToken,
        this.getTrustedCookieOptions(trustedDeviceTtl)
      )
    }

    return success(i18n.t('auth.step_up.success'), result)
  }

  @Post('login/passkey/options')
  @Throttle(passkeyThrottle())
  @HttpCode(HttpStatus.OK)
  async passkeyLoginOptions(
    @Body() dto: PasskeyOptionsDto,
    @I18n() i18n: I18nContext
  ) {
    const options = await this.stepUpService.initiatePasskeyLoginOptions(
      dto.challengeId,
      i18n
    )
    return success(i18n.t('auth.step_up.passkey_options'), options)
  }

  @Post('login/passkey/verify')
  @Throttle(passkeyThrottle())
  @HttpCode(HttpStatus.OK)
  async passkeyLoginVerify(
    @Body() dto: VerifyPasskeyLoginDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const {
      refreshToken,
      rawDeviceSecret,
      trustedDeviceToken,
      trustedDeviceTtl,
      ...result
    } = await this.stepUpService.verifyPasskeyLogin(
      dto.challengeId,
      dto.response as unknown as AuthenticationResponseJSON,
      i18n,
      ipAddress,
      userAgent,
      dto.trustDevice,
      req.cookies?.deviceSecret as string | undefined
    )

    res.cookie('refreshToken', refreshToken, this.getCookieOptions())
    res.cookie('deviceSecret', rawDeviceSecret, this.getDeviceCookieOptions())
    if (trustedDeviceToken) {
      res.cookie(
        'trustedDevice',
        trustedDeviceToken,
        this.getTrustedCookieOptions(trustedDeviceTtl)
      )
    }

    return success(i18n.t('auth.step_up.success'), result)
  }

  @Post('login/passkey/discover')
  @Throttle(passkeyThrottle())
  @HttpCode(HttpStatus.OK)
  async passkeyDiscover(@I18n() i18n: I18nContext) {
    const result = await this.loginService.beginPasskeyDiscovery()
    return success(i18n.t('auth.step_up.passkey_options'), result)
  }

  @Post('login/passkey/authenticate')
  @Throttle(passkeyThrottle())
  @HttpCode(HttpStatus.OK)
  async passkeyAuthenticate(
    @Body() dto: PasswordlessAuthDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const { refreshToken, rawDeviceSecret, ...result } =
      await this.loginService.finishPasskeyDiscovery(
        dto.challengeId,
        dto.response as unknown as AuthenticationResponseJSON,
        i18n,
        ipAddress,
        userAgent,
        req.cookies?.deviceSecret as string | undefined
      )

    res.cookie('refreshToken', refreshToken, this.getCookieOptions())
    res.cookie('deviceSecret', rawDeviceSecret, this.getDeviceCookieOptions())

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

    const existingDeviceSecret = req.cookies?.deviceSecret as string | undefined

    const { refreshToken, rawDeviceSecret, ...result } =
      await this.authService.refreshToken(
        { refreshToken: token },
        i18n,
        ipAddress,
        userAgent,
        existingDeviceSecret
      )

    res.cookie('refreshToken', refreshToken, this.getCookieOptions())
    res.cookie('deviceSecret', rawDeviceSecret, this.getDeviceCookieOptions())

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
    await this.authService.logout(user.jti)
    res.clearCookie('refreshToken', { path: this.AUTH_COOKIE_PATH })
    res.clearCookie('deviceSecret', { path: this.DEVICE_COOKIE_PATH })
    return success(i18n.t('auth.logout.success'), null)
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  @UseGuards(ActiveUserGuard, SudoGuard)
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.authService.changePassword(
      user.id,
      user.jti,
      user.fph,
      dto.password,
      i18n,
      ipAddress,
      userAgent
    )
    return success(result.message, null)
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ActiveUserGuard)
  async me(@CurrentUser() user: CurrentUserPayload, @I18n() i18n: I18nContext) {
    const profile = await getProfile(user.id)
    const memberships = await OrganizationMembers.listByUser(user.id)
    const primary = memberships[0] ?? null
    const organization = primary
      ? {
          id: primary.organization.id,
          name: primary.organization.name,
          role: primary.role,
          memberCount: await OrganizationMembers.countByOrg(
            primary.organizationId
          ),
        }
      : null
    return success(i18n.t('common.success.generic'), {
      ...profile,
      organization,
    })
  }

  @Get('trusted-devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ActiveUserGuard)
  async getTrustedDevices(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.trustedDevices.list(user.id, i18n)
    return success(result.message, result.data)
  }

  @Delete('trusted-devices/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  @UseGuards(ActiveUserGuard, SudoGuard)
  async revokeTrustedDevice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.trustedDevices.revoke(
      user.id,
      id,
      i18n,
      ipAddress,
      userAgent
    )
    return success(result.message, null)
  }

  @Delete('sessions/others')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  @UseGuards(ActiveUserGuard, SudoGuard)
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

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ActiveUserGuard)
  async getSessions(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.authService.getActiveSessions(
      user.id,
      user.jti,
      i18n
    )
    return success(result.message, result.data)
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  @UseGuards(ActiveUserGuard, SudoGuard)
  async revokeSessions(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RevokeSessionsDto,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.revokeSessions(
      user.id,
      dto.jtis,
      i18n
    )

    if (dto.jtis.includes(user.jti)) {
      res.clearCookie('refreshToken', { path: this.AUTH_COOKIE_PATH })
      res.clearCookie('deviceSecret', { path: this.DEVICE_COOKIE_PATH })
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
    const lockout = await this.verificationStore.getLockout(user.email)

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
