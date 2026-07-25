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
import { success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import configuration from '@/config/configuration'

const config = configuration()

@Controller('auth/sudo')
@UseGuards(ActiveUserGuard)
export class SudoController {
  constructor(private readonly sudoService: SudoService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: config.throttle.auth.limit,
      ttl: config.throttle.auth.ttl,
    },
  })
  async elevate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SudoDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.sudoService.elevate(
      user.id,
      user.jti,
      { method: dto.method, password: dto.password, code: dto.code },
      i18n
    )
    return success(i18n.t('auth.sudo.success'), result)
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
