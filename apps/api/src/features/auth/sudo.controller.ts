import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { I18n, I18nContext } from 'nestjs-i18n'
import { SudoService } from './services/sudo.service'
import { SudoDto } from './dto/sudo.dto'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { authThrottle } from '@/common/helpers/throttle.helper'

@Controller('auth/sudo')
@UseGuards(ActiveUserGuard)
export class SudoController {
  constructor(private readonly sudoService: SudoService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  async elevate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SudoDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.sudoService.elevate(
      user.id,
      user.jti,
      {
        method: dto.method,
        password: dto.password,
        code: dto.code,
        response: dto.response as AuthenticationResponseJSON | undefined,
      },
      i18n
    )
    return success(i18n.t('auth.sudo.success'), result)
  }

  @Post('passkey/options')
  @HttpCode(HttpStatus.OK)
  @Throttle(authThrottle())
  async passkeyOptions(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const options = await this.sudoService.passkeyOptions(user.id, user.jti)
    return success(i18n.t('auth.sudo.passkey_options'), options)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async status(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.sudoService.status(user.jti)
    return success(i18n.t('auth.sudo.status_success'), result)
  }
}
