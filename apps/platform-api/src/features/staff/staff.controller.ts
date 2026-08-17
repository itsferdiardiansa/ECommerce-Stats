import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import {
  InviteStaffDto,
  AssignRoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  ListStaffQueryDto,
  ListAuditQueryDto,
  ListInvitationsQueryDto,
} from './dto/staff.dto'

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
  async list(@Query() query: ListStaffQueryDto, @I18n() i18n: I18nContext) {
    const result = await this.staff.list(query)
    return success(i18n.t('staff.success.list'), result)
  }

  @Get('permissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.view')
  async permissions(@I18n() i18n: I18nContext) {
    const result = await this.staff.listPermissions()
    return success(i18n.t('staff.success.permissions'), result)
  }

  @Get('audit')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('audit.view')
  async audit(@Query() query: ListAuditQueryDto, @I18n() i18n: I18nContext) {
    const result = await this.staff.listAudit(query)
    return success(i18n.t('staff.success.audit'), result)
  }

  @Get('audit/filters')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('audit.view')
  async auditFilters(@I18n() i18n: I18nContext) {
    const result = await this.staff.auditFilters()
    return success(i18n.t('staff.success.audit'), result)
  }

  @Get('invitations')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.view')
  async invitations(
    @Query() query: ListInvitationsQueryDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.listInvitations(query)
    return success(i18n.t('staff.success.invitations'), result)
  }

  @Post('invitations/:id/resend')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.manage')
  async resendInvitation(
    @Param('id') id: string,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.resendInvitation(req.staff!.id, id)
    return success(i18n.t('staff.success.invite_resent'), result)
  }

  @Delete('invitations/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.manage')
  async cancelInvitation(
    @Param('id') id: string,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.cancelInvitation(req.staff!.id, id)
    return success(i18n.t('staff.success.invite_cancelled'), result)
  }

  @Get('roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.view')
  async roles(@I18n() i18n: I18nContext) {
    const result = await this.staff.listRoles()
    return success(i18n.t('staff.success.roles'), result)
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('roles.manage')
  async createRole(
    @Body() dto: CreateRoleDto,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.createRole(req.staff!.id, dto)
    return created(i18n.t('staff.success.role_created'), result)
  }

  @Get('roles/:key/members')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('staff.view')
  async roleMembers(@Param('key') key: string, @I18n() i18n: I18nContext) {
    const result = await this.staff.roleMembers(key)
    return success(i18n.t('staff.success.role_members'), result)
  }

  @Patch('roles/:key')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('roles.manage')
  async updateRole(
    @Param('key') key: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.updateRole(req.staff!.id, key, dto)
    return success(i18n.t('staff.success.role_updated'), result)
  }

  @Delete('roles/:key')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('roles.manage')
  async deleteRole(
    @Param('key') key: string,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.deleteRole(req.staff!.id, key)
    return success(i18n.t('staff.success.role_deleted'), result)
  }

  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('roles.manage')
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.assignRole(req.staff!.id, id, dto.roleKey)
    return success(i18n.t('staff.success.role_assigned'), result)
  }

  @Delete(':id/roles/:roleKey')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('roles.manage')
  async removeRole(
    @Param('id') id: string,
    @Param('roleKey') roleKey: string,
    @Req() req: Request & { staff?: StaffRequestUser },
    @I18n() i18n: I18nContext
  ) {
    const result = await this.staff.removeRole(req.staff!.id, id, roleKey)
    return success(i18n.t('staff.success.role_removed'), result)
  }
}
