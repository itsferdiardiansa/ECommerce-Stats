import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { ListUserDto } from './dto/list-user.dto'
import { success, paginated } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { SudoGuard } from '@/common/guards/sudo.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { RequireSudo } from '@/common/decorators/require-sudo.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

@Controller('users')
@UseGuards(ActiveUserGuard, SudoGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(@Query() query: ListUserDto, @I18n() i18n: I18nContext) {
    const result = await this.usersService.list(query)
    return paginated(i18n.t('common.success.generic'), result.data, result.meta)
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @I18n() i18n: I18nContext
  ) {
    const user = await this.usersService.findOne(id, i18n)
    return success(i18n.t('common.success.generic'), user)
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @I18n() i18n: I18nContext,
    @CurrentUser() user: CurrentUserPayload
  ) {
    const result = await this.usersService.update(
      id,
      dto,
      i18n,
      user.id,
      user.isStaff
    )
    return success(i18n.t('users.update.success'), result)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireSudo()
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @I18n() i18n: I18nContext,
    @CurrentUser() user: CurrentUserPayload
  ) {
    const removed = await this.usersService.remove(
      id,
      i18n,
      user.id,
      user.isStaff
    )
    return success(i18n.t('users.delete.success'), removed)
  }
}
