import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { I18n, I18nContext } from 'nestjs-i18n'
import { MfaService } from './services/mfa.service'
import { ConfirmTotpDto } from './dto/mfa.dto'
import { success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { SudoGuard } from '@/common/guards/sudo.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { RequireSudo } from '@/common/decorators/require-sudo.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { authThrottle } from '@/common/helpers/throttle.helper'

@Controller('auth/mfa')
@UseGuards(ActiveUserGuard, SudoGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async status(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.mfaService.status(user.id)
    return success(i18n.t('auth.mfa.status_success'), result)
  }

  @Post('totp')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  async beginTotp(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.mfaService.beginTotpEnrolment(user.id, i18n)
    return success(i18n.t('auth.mfa.enrolment_started'), result)
  }

  @Post('totp/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  async confirmTotp(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ConfirmTotpDto,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.mfaService.confirmTotpEnrolment(
      user.id,
      user.jti,
      dto.code,
      i18n,
      ipAddress,
      userAgent
    )
    return success(i18n.t('auth.mfa.enabled'), result)
  }

  @Delete('totp')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  async disableTotp(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    await this.mfaService.disableTotp(user.id, i18n, ipAddress, userAgent)
    return success(i18n.t('auth.mfa.disabled'), null)
  }

  @Post('recovery-codes')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  @RequireSudo()
  async regenerateRecoveryCodes(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const recoveryCodes = await this.mfaService.regenerateRecoveryCodes(user.id)
    return success(i18n.t('auth.mfa.recovery_codes_regenerated'), {
      recoveryCodes,
    })
  }
}
