import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { I18n, I18nContext } from 'nestjs-i18n'
import { PasswordResetService } from './services/password-reset.service'
import { EmailChangeService } from './services/email-change.service'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import {
  RequestEmailChangeDto,
  ConfirmEmailChangeDto,
} from './dto/change-email.dto'
import { success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { SudoGuard } from '@/common/guards/sudo.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { RequireSudo } from '@/common/decorators/require-sudo.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { authThrottle } from '@/common/helpers/throttle.helper'

@Controller('auth')
export class AccountController {
  constructor(
    private readonly passwordReset: PasswordResetService,
    private readonly emailChange: EmailChangeService
  ) {}

  @Post('forgot-password')
  @Throttle(authThrottle())
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @I18n() i18n: I18nContext
  ) {
    await this.passwordReset.forgotPassword(dto.email, i18n)
    return success(i18n.t('auth.forgot_password.success'), null)
  }

  @Post('reset-password')
  @Throttle(authThrottle())
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @I18n() i18n: I18nContext
  ) {
    await this.passwordReset.resetPassword(dto.token, dto.password, i18n)
    return success(i18n.t('auth.reset_password.success'), null)
  }

  @Post('email/change')
  @Throttle(authThrottle())
  @RequireSudo()
  @UseGuards(ActiveUserGuard, SudoGuard)
  @HttpCode(HttpStatus.OK)
  async requestEmailChange(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RequestEmailChangeDto,
    @I18n() i18n: I18nContext
  ) {
    await this.emailChange.requestChange(user.id, dto.newEmail, i18n)
    return success(i18n.t('auth.email_change.requested'), null)
  }

  @Post('email/change/confirm')
  @Throttle(authThrottle())
  @UseGuards(ActiveUserGuard)
  @HttpCode(HttpStatus.OK)
  async confirmEmailChange(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ConfirmEmailChangeDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.emailChange.confirmChange(user.id, dto.code, i18n)
    return success(i18n.t('auth.email_change.success'), result)
  }
}
