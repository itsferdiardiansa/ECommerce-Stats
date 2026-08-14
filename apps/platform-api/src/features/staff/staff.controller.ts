import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { I18n, I18nContext } from 'nestjs-i18n'
import { success, created } from '@rufieltics/api-core'
import { StaffService } from './staff.service'
import { StaffAuthGuard } from '../staff-auth/guards/staff-auth.guard'
import { StaffPermissionGuard } from '../staff-auth/guards/staff-permission.guard'
import { RequirePermission } from '../staff-auth/decorators/require-permission.decorator'
import type { StaffRequestUser } from '../staff-auth/guards/staff-auth.guard'
import { InviteStaffDto, AssignRoleDto } from './dto/staff.dto'

@Controller('staff')
@UseGuards(StaffAuthGuard, StaffPermissionGuard)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('staff.manage')
  async invite(
    @Body() dto: InviteStaffDto,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.invite(req.staff!.id, dto)
    return created(i18n.t('staff.success.invited'), result)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.view')
  async list(@I18n() i18n: I18nContext) {
    const result = await this.staff.list()
    return success(i18n.t('staff.success.list'), result)
  }

  @Get('roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.view')
  async roles(@I18n() i18n: I18nContext) {
    const result = await this.staff.listRoles()
    return success(i18n.t('staff.success.roles'), result)
  }

  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.manage')
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.assignRole(req.staff!.id, id, dto.roleKey)
    return success(i18n.t('staff.success.role_assigned'), result)
  }
}
