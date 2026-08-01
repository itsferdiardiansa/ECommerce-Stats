import {
  Controller,
  Body,
  Param,
  Put,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { UsersService } from './users.service'
import { AdminUpdateUserDto } from './dto/admin-update-user.dto'
import { success } from '@/common/helpers/api-response.helper'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { AdminGuard } from '@/common/guards/admin.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

@Controller('admin/users')
@UseGuards(ActiveUserGuard, AdminGuard)
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
    @I18n() i18n: I18nContext,
    @CurrentUser() user: CurrentUserPayload
  ) {
    const result = await this.usersService.update(id, dto, i18n, user.id, true)
    return success(i18n.t('users.update.success'), result)
  }
}
