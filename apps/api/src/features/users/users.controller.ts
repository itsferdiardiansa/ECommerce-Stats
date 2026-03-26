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
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { ListUserDto } from './dto/list-user.dto'
import { success, paginated } from '@/common/helpers/api-response.helper'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(@Query() query: ListUserDto, @I18n() i18n: I18nContext) {
    const result = await this.usersService.list(query)
    return paginated(i18n.t('common.success.generic'), result.data, result.meta)
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @I18n() i18n: I18nContext) {
    const user = await this.usersService.findOne(Number(id), i18n)
    return success(i18n.t('common.success.generic'), user)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @I18n() i18n: I18nContext
  ) {
    const user = await this.usersService.update(Number(id), dto, i18n)
    return success(i18n.t('users.update.success'), user)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @I18n() i18n: I18nContext) {
    const user = await this.usersService.remove(Number(id), i18n)
    return success(i18n.t('users.delete.success'), user)
  }
}
