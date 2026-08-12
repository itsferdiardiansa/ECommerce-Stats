import {
  Controller,
  Get,
  Query,
  Ip,
  Headers,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request, Response, CookieOptions } from 'express'
import { Throttle } from '@nestjs/throttler'
import { I18n, I18nContext } from 'nestjs-i18n'
import { OAuthService } from './services/oauth.service'
import { JwtService } from '@/modules/jwt/jwt.service'
import { authThrottle } from '@/common/helpers/throttle.helper'
import configuration from '@/config/configuration'

const config = configuration()

@Controller('auth/oauth')
export class OAuthController {
  private readonly AUTH_COOKIE_PATH = '/api/v1/auth'
  private readonly DEVICE_COOKIE_PATH = '/api/v1'
  private readonly OAUTH_STATE_COOKIE = 'oauthState'
  private readonly OAUTH_COOKIE_PATH = '/api/v1/auth/oauth'

  constructor(
    private readonly oauthService: OAuthService,
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

  private getStateCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: this.OAUTH_COOKIE_PATH,
      maxAge: config.security.oauth.stateTtlSeconds * 1000,
    }
  }

  @Get('google')
  @Throttle(authThrottle())
  async googleRedirect(
    @I18n() i18n: I18nContext,
    @Res() res: Response
  ): Promise<void> {
    try {
      const { url, state } = await this.oauthService.createGoogleAuthUrl(i18n)
      res.cookie(this.OAUTH_STATE_COOKIE, state, this.getStateCookieOptions())
      res.redirect(url)
    } catch {
      res.redirect(config.security.oauth.failureRedirect)
    }
  }

  @Get('google/callback')
  @Throttle(authThrottle())
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const cookieState = req.cookies?.[this.OAUTH_STATE_COOKIE] as
      | string
      | undefined
    res.clearCookie(this.OAUTH_STATE_COOKIE, { path: this.OAUTH_COOKIE_PATH })

    if (!code || !state) {
      res.redirect(config.security.oauth.failureRedirect)
      return
    }

    try {
      const { refreshToken, rawDeviceSecret } =
        await this.oauthService.handleGoogleCallback(
          code,
          state,
          cookieState,
          i18n,
          ipAddress,
          userAgent,
          req.cookies?.deviceSecret as string | undefined
        )

      res.cookie('refreshToken', refreshToken, this.getCookieOptions())
      res.cookie('deviceSecret', rawDeviceSecret, this.getDeviceCookieOptions())
      res.redirect(config.security.oauth.successRedirect)
    } catch (err) {
      res.redirect(this.failureUrl(err))
    }
  }

  /** A frozen account gets a distinct `error=locked` so the sign-in page can explain it. */
  private failureUrl(err: unknown): string {
    const failure = config.security.oauth.failureRedirect
    const frozen =
      err instanceof UnauthorizedException &&
      err.message === 'auth.errors.account_frozen'
    if (!frozen) return failure
    const url = new URL(failure)
    url.searchParams.set('error', 'locked')
    return url.toString()
  }
}
