import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { OrganizationsService } from './organizations.service'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { success } from '@/common/helpers/api-response.helper'

@Controller('organizations')
@UseGuards(ActiveUserGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get(':orgId')
  @HttpCode(HttpStatus.OK)
  async getOrg(
    @Param('orgId') orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const org = await this.orgsService.getOrg(orgId, user, i18n)
    return success(i18n.t('common.success'), org)
  }

  @Get(':orgId/members')
  @HttpCode(HttpStatus.OK)
  async listMembers(
    @Param('orgId') orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const members = await this.orgsService.listMembers(orgId, user, i18n)
    return success(i18n.t('common.success'), members)
  }

  @Put(':orgId/members/:userId/role')
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('role') role: string,
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.orgsService.updateMemberRole(
      orgId,
      userId,
      role,
      user,
      i18n
    )
    return success(i18n.t('common.success'), result)
  }

  @Delete(':orgId/members/:userId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    await this.orgsService.removeMember(orgId, userId, user, i18n)
    return success(i18n.t('common.success'), null)
  }
}
