import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import {
  Organizations,
  OrganizationMembers,
} from '@rufieltics/db/domains/identity/organization'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

const ROLE_PRIORITY: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  ANALYST: 2,
  VIEWER: 1,
}

@Injectable()
export class OrganizationsService {
  async getOrg(orgId: string, user: CurrentUserPayload, i18n: I18nContext) {
    const org = await Organizations.findById(orgId)
    if (!org) throw new NotFoundException(i18n.t('common.errors.not_found'))

    if (!user.isStaff) {
      const membership = await OrganizationMembers.findByOrgAndUser(
        orgId,
        user.id
      )
      if (!membership)
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))
    }

    return org
  }

  async listMembers(
    orgId: string,
    user: CurrentUserPayload,
    i18n: I18nContext
  ) {
    if (!user.isStaff) {
      const membership = await OrganizationMembers.findByOrgAndUser(
        orgId,
        user.id
      )
      if (!membership)
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))
    }
    return OrganizationMembers.listByOrg(orgId)
  }

  async updateMemberRole(
    orgId: string,
    targetUserId: number,
    newRole: string,
    caller: CurrentUserPayload,
    i18n: I18nContext
  ) {
    if (!caller.isStaff) {
      const callerMembership = await OrganizationMembers.findByOrgAndUser(
        orgId,
        caller.id
      )
      if (!callerMembership)
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))

      const callerPrio = ROLE_PRIORITY[callerMembership.role] ?? 0
      const targetPrio = ROLE_PRIORITY[newRole] ?? 0

      if (callerPrio < ROLE_PRIORITY['ADMIN']) {
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))
      }
      if (targetPrio >= callerPrio) {
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))
      }
    }

    const target = await OrganizationMembers.findByOrgAndUser(
      orgId,
      targetUserId
    )
    if (!target) throw new NotFoundException(i18n.t('common.errors.not_found'))

    return OrganizationMembers.updateRole(orgId, targetUserId, newRole as never)
  }

  async removeMember(
    orgId: string,
    targetUserId: number,
    caller: CurrentUserPayload,
    i18n: I18nContext
  ) {
    if (!caller.isStaff) {
      const callerMembership = await OrganizationMembers.findByOrgAndUser(
        orgId,
        caller.id
      )
      if (!callerMembership)
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))
      if (
        (ROLE_PRIORITY[callerMembership.role] ?? 0) < ROLE_PRIORITY['ADMIN']
      ) {
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))
      }
      if (targetUserId === caller.id) {
        throw new ForbiddenException(i18n.t('common.errors.forbidden'))
      }
    }

    const target = await OrganizationMembers.findByOrgAndUser(
      orgId,
      targetUserId
    )
    if (!target) throw new NotFoundException(i18n.t('common.errors.not_found'))

    return OrganizationMembers.removeMember(orgId, targetUserId)
  }
}
