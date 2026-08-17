import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  StaffAccounts,
  StaffRoles,
  StaffInvitations,
  Permissions,
  AdminAudit,
  getStaffPermissions,
} from '@rufieltics/db/domains/internal'
import { StaffTokenService } from '../staff-auth/staff-token.service'
import { MailService } from '../../modules/mail/mail.service'

const INVITE_EXPIRES_MINUTES = 7 * 24 * 60
const MAX_INVITES_PER_EMAIL_PER_DAY = 5

@Injectable()
export class StaffService {
  constructor(
    private readonly tokens: StaffTokenService,
    private readonly config: ConfigService,
    private readonly mail: MailService
  ) {}

  private inviteExpiry() {
    return new Date(Date.now() + INVITE_EXPIRES_MINUTES * 60_000)
  }

  private async assertInviteQuota(email: string) {
    const since = new Date(Date.now() - 24 * 60 * 60_000)
    const count = await AdminAudit.countInvitesForEmailSince(email, since)
    if (count >= MAX_INVITES_PER_EMAIL_PER_DAY) {
      throw new HttpException(
        'staff.errors.too_many_invites',
        HttpStatus.TOO_MANY_REQUESTS
      )
    }
  }

  private async assignRoles(staffId: string, roleKeys: string[], by: string) {
    for (const key of roleKeys) {
      const role = await StaffRoles.findByKey(key)
      if (role) await StaffAccounts.assignRole(staffId, role.id, by)
    }
  }

  private async deliverInvite(staffId: string, email: string, name: string) {
    const inviteToken = this.tokens.signInvite(staffId)
    const setupUrl = `${this.config.get<string>(
      'PLATFORM_WEB_URL',
      'http://localhost:3001'
    )}/setup?token=${inviteToken}`

    await this.mail.sendStaffInvite({
      to: email,
      name,
      url: setupUrl,
      expiresInMinutes: INVITE_EXPIRES_MINUTES,
    })

    return { inviteToken, setupUrl }
  }

  private devExtras(inviteToken: string, setupUrl: string) {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production'
    return isProduction ? {} : { inviteToken, setupUrl }
  }

  async invite(
    inviterId: string,
    input: { email: string; name: string; roleKeys?: string[] }
  ) {
    await this.assertInviteQuota(input.email)

    const existing = await StaffAccounts.findByEmail(input.email)
    if (existing) {
      throw new ConflictException('staff.errors.email_exists')
    }

    const roleKeys = input.roleKeys ?? []
    const staff = await StaffAccounts.create({
      email: input.email,
      name: input.name,
      status: 'INVITED',
      createdById: inviterId,
    })
    await this.assignRoles(staff.id, roleKeys, inviterId)

    const invitation = await StaffInvitations.create({
      email: input.email,
      name: input.name,
      status: 'PENDING',
      roleKeys,
      expiresAt: this.inviteExpiry(),
      invitedById: inviterId,
      staffAccountId: staff.id,
    })

    const { inviteToken, setupUrl } = await this.deliverInvite(
      staff.id,
      staff.email,
      staff.name
    )

    await AdminAudit.log({
      staffAccountId: inviterId,
      action: 'staff.invited',
      targetType: 'invitation',
      targetId: invitation.id,
      metadata: { email: input.email, invitationId: invitation.id },
    })

    return {
      staffId: staff.id,
      invitationId: invitation.id,
      email: staff.email,
      ...this.devExtras(inviteToken, setupUrl),
    }
  }

  async listInvitations(params: {
    search?: string
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    page: number
    pageSize: number
  }) {
    return StaffInvitations.search({
      search: params.search || undefined,
      status: params.status,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    })
  }

  async resendInvitation(actorId: string, invitationId: string) {
    const invitation = await StaffInvitations.findById(invitationId)
    if (!invitation) {
      throw new NotFoundException('staff.errors.invitation_not_found')
    }
    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('staff.errors.invite_already_accepted')
    }
    await this.assertInviteQuota(invitation.email)

    let account =
      (invitation.staffAccountId
        ? await StaffAccounts.findById(invitation.staffAccountId)
        : null) ?? (await StaffAccounts.findByEmail(invitation.email))

    if (account && account.status !== 'INVITED') {
      throw new ConflictException('staff.errors.email_exists')
    }
    if (!account) {
      account = await StaffAccounts.create({
        email: invitation.email,
        name: invitation.name,
        status: 'INVITED',
        createdById: actorId,
      })
      await this.assignRoles(account.id, invitation.roleKeys, actorId)
    }

    const { inviteToken, setupUrl } = await this.deliverInvite(
      account.id,
      account.email,
      account.name
    )

    await StaffInvitations.update(invitation.id, {
      status: 'PENDING',
      expiresAt: this.inviteExpiry(),
      resentAt: new Date(),
      rejectedAt: null,
      resendCount: { increment: 1 },
      staffAccountId: account.id,
    })

    await AdminAudit.log({
      staffAccountId: actorId,
      action: 'staff.invitation.resent',
      targetType: 'invitation',
      targetId: invitation.id,
      metadata: { email: invitation.email, invitationId: invitation.id },
    })

    return {
      success: true,
      ...this.devExtras(inviteToken, setupUrl),
    }
  }

  async list(params: {
    search?: string
    status?: 'ALL' | 'INVITED' | 'ACTIVE' | 'SUSPENDED'
    role?: string
    page: number
    pageSize: number
  }) {
    const superOnly = params.role === '__super'
    const roleKey =
      params.role && params.role !== 'ALL' && params.role !== '__super'
        ? params.role
        : undefined
    const status =
      params.status && params.status !== 'ALL' ? params.status : undefined

    const { items, total } = await StaffAccounts.search({
      search: params.search || undefined,
      status,
      roleKey,
      superOnly,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    })

    return {
      items: items.map(s => ({
        id: s.id,
        email: s.email,
        name: s.name,
        isSuperAdmin: s.isSuperAdmin,
        status: s.status,
        roles: s.roles.map(r => r.role.key),
        lastLoginAt: s.lastLoginAt,
        createdAt: s.createdAt,
      })),
      total,
    }
  }

  async listPermissions() {
    const permissions = await Permissions.list()
    return permissions.map(p => ({ key: p.key, description: p.description }))
  }

  async listRoles() {
    const roles = await StaffRoles.list()
    return roles.map(r => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions.map(p => p.permission.key),
      memberCount: r._count.members,
    }))
  }

  async roleMembers(roleKey: string) {
    const role = await StaffRoles.findByKey(roleKey)
    if (!role) throw new NotFoundException('staff.errors.role_not_found')
    return StaffRoles.members(role.id)
  }

  async listAudit(params: {
    search?: string
    action?: string
    targetType?: string
    page: number
    pageSize: number
  }) {
    return AdminAudit.search({
      search: params.search || undefined,
      action: params.action || undefined,
      targetType: params.targetType || undefined,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    })
  }

  async auditFilters() {
    return AdminAudit.distinctFilters()
  }

  async cancelInvitation(actorId: string, invitationId: string) {
    const invitation = await StaffInvitations.findById(invitationId)
    if (!invitation) {
      throw new NotFoundException('staff.errors.invitation_not_found')
    }
    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('staff.errors.invite_already_accepted')
    }

    if (invitation.staffAccountId) {
      const account = await StaffAccounts.findById(invitation.staffAccountId)
      if (account && account.status === 'INVITED') {
        await StaffAccounts.remove(account.id)
      }
    }

    await StaffInvitations.update(invitation.id, {
      status: 'REJECTED',
      rejectedAt: new Date(),
      staffAccountId: null,
    })

    await AdminAudit.log({
      staffAccountId: actorId,
      action: 'staff.invite_cancelled',
      targetType: 'invitation',
      targetId: invitation.id,
      metadata: { email: invitation.email, invitationId: invitation.id },
    })
    return { success: true }
  }

  /**
   * Prevent privilege escalation: a non-super-admin can only grant permissions
   * they already hold (super-admin holds every key).
   */
  private async assertCanGrant(actorId: string, permissionKeys: string[]) {
    const actorPermissions = new Set(await getStaffPermissions(actorId))
    const escalating = permissionKeys.filter(k => !actorPermissions.has(k))
    if (escalating.length > 0) {
      throw new ForbiddenException('staff.errors.cannot_grant')
    }
  }

  async createRole(
    actorId: string,
    input: {
      key: string
      name: string
      description?: string
      permissionKeys: string[]
    }
  ) {
    const existing = await StaffRoles.findByKey(input.key)
    if (existing) throw new ConflictException('staff.errors.role_key_exists')
    await this.assertCanGrant(actorId, input.permissionKeys)

    const role = await StaffRoles.create(input)
    await AdminAudit.log({
      staffAccountId: actorId,
      action: 'staff.role_created',
      targetType: 'role',
      targetId: role.id,
      metadata: { key: role.key },
    })
    return this.serializeRole(role)
  }

  async updateRole(
    actorId: string,
    roleKey: string,
    input: { name?: string; description?: string; permissionKeys?: string[] }
  ) {
    const role = await StaffRoles.findByKey(roleKey)
    if (!role) throw new NotFoundException('staff.errors.role_not_found')
    if (role.isSystem) {
      throw new BadRequestException('staff.errors.role_system_locked')
    }
    if (input.permissionKeys) {
      await this.assertCanGrant(actorId, input.permissionKeys)
    }

    if (input.name !== undefined || input.description !== undefined) {
      await StaffRoles.update(role.id, {
        name: input.name,
        description: input.description,
      })
    }
    if (input.permissionKeys) {
      await StaffRoles.setPermissions(role.id, input.permissionKeys)
    }

    await AdminAudit.log({
      staffAccountId: actorId,
      action: 'staff.role_updated',
      targetType: 'role',
      targetId: role.id,
      metadata: { key: role.key },
    })
    const updated = await StaffRoles.findById(role.id)
    return this.serializeRole(updated!)
  }

  async deleteRole(actorId: string, roleKey: string) {
    const role = await StaffRoles.findByKey(roleKey)
    if (!role) throw new NotFoundException('staff.errors.role_not_found')
    if (role.isSystem) {
      throw new BadRequestException('staff.errors.role_system_locked')
    }

    await StaffRoles.remove(role.id)
    await AdminAudit.log({
      staffAccountId: actorId,
      action: 'staff.role_deleted',
      targetType: 'role',
      targetId: role.id,
      metadata: { key: role.key },
    })
    return { success: true }
  }

  async assignRole(actorId: string, staffId: string, roleKey: string) {
    const staff = await StaffAccounts.findById(staffId)
    if (!staff) throw new NotFoundException('staff.errors.account_not_found')
    if (staff.isSuperAdmin) {
      throw new ForbiddenException('staff.errors.cannot_modify_superadmin')
    }
    const role = await StaffRoles.findByKey(roleKey)
    if (!role) throw new NotFoundException('staff.errors.role_not_found')

    // Can't grant a role that carries permissions the actor doesn't hold.
    const full = await StaffRoles.findById(role.id)
    await this.assertCanGrant(
      actorId,
      full?.permissions.map(p => p.permission.key) ?? []
    )

    await StaffAccounts.assignRole(staffId, role.id, actorId)
    await AdminAudit.log({
      staffAccountId: actorId,
      action: 'staff.role_assigned',
      targetType: 'staff',
      targetId: staffId,
      metadata: { roleKey },
    })
    return { success: true }
  }

  async removeRole(actorId: string, staffId: string, roleKey: string) {
    const staff = await StaffAccounts.findById(staffId)
    if (!staff) throw new NotFoundException('staff.errors.account_not_found')
    if (staff.isSuperAdmin) {
      throw new ForbiddenException('staff.errors.cannot_modify_superadmin')
    }
    const role = await StaffRoles.findByKey(roleKey)
    if (!role) throw new NotFoundException('staff.errors.role_not_found')

    await StaffAccounts.removeRole(staffId, role.id)

    // Self-lockout guard: don't let an actor strip their own role management.
    if (actorId === staffId) {
      const remaining = await getStaffPermissions(actorId)
      if (!remaining.includes('roles.manage')) {
        await StaffAccounts.assignRole(staffId, role.id, actorId)
        throw new ForbiddenException('staff.errors.self_lockout')
      }
    }

    await AdminAudit.log({
      staffAccountId: actorId,
      action: 'staff.role_removed',
      targetType: 'staff',
      targetId: staffId,
      metadata: { roleKey },
    })
    return { success: true }
  }

  private serializeRole(role: {
    id: string
    key: string
    name: string
    description: string | null
    isSystem: boolean
    permissions: { permission: { key: string } }[]
  }) {
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map(p => p.permission.key),
    }
  }
}
