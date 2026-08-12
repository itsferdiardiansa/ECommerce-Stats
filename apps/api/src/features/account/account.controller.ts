import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { AccountService } from './account.service'
import { UpdateAccountSettingsDto } from './dto/update-settings.dto'
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto'
import { success, created } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

@Controller('account')
@UseGuards(ActiveUserGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('settings')
  @HttpCode(HttpStatus.OK)
  async getSettings(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.getSettings(user.id)
    return success(i18n.t('common.success.generic'), data)
  }

  @Patch('settings')
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAccountSettingsDto,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.updateSettings(user.id, dto)
    return success(i18n.t('account.settings.updated'), data)
  }

  @Get('addresses')
  @HttpCode(HttpStatus.OK)
  async listAddresses(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.listAddresses(user.id)
    return success(i18n.t('common.success.generic'), data)
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAddressDto,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.createAddress(user.id, dto)
    return created(i18n.t('account.address.created'), data)
  }

  @Patch('addresses/:id')
  @HttpCode(HttpStatus.OK)
  async updateAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.updateAddress(user.id, id, dto, i18n)
    return success(i18n.t('account.address.updated'), data)
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @I18n() i18n: I18nContext
  ) {
    await this.account.deleteAddress(user.id, id, i18n)
    return success(i18n.t('account.address.deleted'), null)
  }

  @Post('addresses/:id/default')
  @HttpCode(HttpStatus.OK)
  async setDefaultAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.setDefaultAddress(user.id, id, i18n)
    return success(i18n.t('account.address.default_set'), data)
  }

  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async activity(
    @CurrentUser() user: CurrentUserPayload,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limit: string | undefined,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.listActivity(user.id, {
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
    return success(i18n.t('common.success.generic'), data)
  }

  @Get('connections')
  @HttpCode(HttpStatus.OK)
  async connections(
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.listConnections(user.id)
    return success(i18n.t('common.success.generic'), data)
  }

  @Delete('connections/:provider')
  @HttpCode(HttpStatus.OK)
  async unlinkConnection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('provider') provider: string,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.account.unlinkConnection(user.id, provider, i18n)
    return success(i18n.t('account.connection.unlinked'), data)
  }
}
