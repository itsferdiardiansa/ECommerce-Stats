import { Controller, Get, Query, Ip, Headers, Req, Res } from '@nestjs/common'
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
      sameSite: 'strict',
      path: this.AUTH_COOKIE_PATH,
      maxAge: this.jwtService.getRefreshExpiresIn() * 1000,
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
          userAgent
        )

      res.cookie('refreshToken', refreshToken, this.getCookieOptions())
      res.cookie('deviceSecret', rawDeviceSecret, this.getCookieOptions())
      res.redirect(config.security.oauth.successRedirect)
    } catch {
      res.redirect(config.security.oauth.failureRedirect)
    }
  }
}
