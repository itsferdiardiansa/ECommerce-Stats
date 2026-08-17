import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response, CookieOptions } from 'express'
import { I18n, I18nContext } from 'nestjs-i18n'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { success } from '@rufieltics/api-core'
import { StaffAuthService } from './staff-auth.service'
import { StaffAuthGuard } from './guards/staff-auth.guard'
import type { StaffRequestUser } from './guards/staff-auth.guard'
import {
  SetupDto,
  SetupStatusDto,
  ConfirmSetupDto,
  LoginDto,
  MfaDto,
  TotpResetRequestDto,
  TotpResetBeginDto,
  TotpResetConfirmDto,
} from './dto/staff-auth.dto'

const REFRESH_COOKIE = 'staffRefreshToken'
const REFRESH_PATH = '/api/v1/staff/auth'
const DEVICE_COOKIE = 'staffDeviceSecret'
const DEVICE_PATH = '/api/v1/staff'

@Controller('staff/auth')
export class StaffAuthController {
  constructor(private readonly auth: StaffAuthService) {}

  private cookieOptions(path: string = REFRESH_PATH): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  }

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  async setup(@Body() dto: SetupDto, @I18n() i18n: I18nContext) {
    const result = await this.auth.setup(dto.inviteToken, dto.password)
    return success(i18n.t('staff.success.setup_ready'), result)
  }

  @Post('setup/status')
  @HttpCode(HttpStatus.OK)
  async setupStatus(@Body() dto: SetupStatusDto, @I18n() i18n: I18nContext) {
    const result = await this.auth.setupStatus(dto.inviteToken)
    return success(i18n.t('staff.success.setup_ready'), result)
  }

  @Post('setup/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmSetup(@Body() dto: ConfirmSetupDto, @I18n() i18n: I18nContext) {
    const result = await this.auth.confirmSetup(dto.inviteToken, dto.code)
    return success(i18n.t('staff.success.activated'), result)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @I18n() i18n: I18nContext) {
    const result = await this.auth.login(dto.email, dto.password, i18n)
    return success(i18n.t('staff.success.mfa_required'), result)
  }

  @Post('mfa')
  @HttpCode(HttpStatus.OK)
  async mfa(
    @Body() dto: MfaDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @I18n() i18n: I18nContext
  ) {
    const { refreshToken, deviceSecret, ...result } = await this.auth.verifyMfa(
      dto.mfaToken,
      dto.code,
      { ip, userAgent: req.headers['user-agent'] }
    )
    res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions())
    res.cookie(DEVICE_COOKIE, deviceSecret, this.cookieOptions(DEVICE_PATH))
    return success(i18n.t('staff.success.logged_in'), result)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @I18n() i18n: I18nContext
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (!token) throw new BadRequestException('staff.errors.refresh_missing')
    const { refreshToken, deviceSecret, ...result } = await this.auth.refresh(
      token,
      { ip, userAgent: req.headers['user-agent'] }
    )
    res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions())
    res.cookie(DEVICE_COOKIE, deviceSecret, this.cookieOptions(DEVICE_PATH))
    return success(i18n.t('staff.success.refreshed'), result)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(StaffAuthGuard)
  async logout(
    @Req() req: Request & { staff?: StaffRequestUser },
    @Res({ passthrough: true }) res: Response,
    @I18n() i18n: I18nContext
  ) {
    if (req.staff) await this.auth.logout(req.staff.jti)
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH })
    res.clearCookie(DEVICE_COOKIE, { path: DEVICE_PATH })
    return success(i18n.t('staff.success.logged_out'), { success: true })
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(StaffAuthGuard)
  async me(
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.auth.me(req.staff!.id)
    return success(i18n.t('staff.success.profile'), result)
  }

  @Post('totp/reset-request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  async requestTotpReset(
    @Body() dto: TotpResetRequestDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.auth.requestTotpReset(dto.email)
    return success(i18n.t('staff.success.totp_reset_requested'), result)
  }

  @Post('totp/reset/begin')
  @HttpCode(HttpStatus.OK)
  async beginTotpReset(
    @Body() dto: TotpResetBeginDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.auth.beginTotpReset(dto.token)
    return success(i18n.t('staff.success.totp_reset_ready'), result)
  }

  @Post('totp/reset/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmTotpReset(
    @Body() dto: TotpResetConfirmDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.auth.confirmTotpReset(dto.token, dto.code)
    return success(i18n.t('staff.success.totp_reset_done'), result)
  }
}
