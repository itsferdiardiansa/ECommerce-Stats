import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  StaffAccounts,
  StaffRoles,
  AdminAudit,
} from '@rufieltics/db/domains/internal'
import { StaffTokenService } from '../staff-auth/staff-token.service'
import { MailService } from '../../modules/mail/mail.service'

const INVITE_EXPIRES_MINUTES = 7 * 24 * 60

@Injectable()
export class StaffService {
  constructor(
    private readonly tokens: StaffTokenService,
    private readonly config: ConfigService,
    private readonly mail: MailService
  ) {}

  async invite(
    inviterId: string,
    input: { email: string; name: string; roleKeys?: string[] }
  ) {
    const existing = await StaffAccounts.findByEmail(input.email)
    if (existing) {
      throw new ConflictException('staff.errors.email_exists')
    }

    const staff = await StaffAccounts.create({
      email: input.email,
      name: input.name,
      status: 'INVITED',
      createdById: inviterId,
    })

    for (const key of input.roleKeys ?? []) {
      const role = await StaffRoles.findByKey(key)
      if (role) await StaffAccounts.assignRole(staff.id, role.id, inviterId)
    }

    const inviteToken = this.tokens.signInvite(staff.id)
    const setupUrl = `${this.config.get<string>(
      'PLATFORM_WEB_URL',
      'http://localhost:3001'
    )}/setup?token=${inviteToken}`

    await this.mail.sendStaffInvite({
      to: staff.email,
      name: staff.name,
      url: setupUrl,
      expiresInMinutes: INVITE_EXPIRES_MINUTES,
    })

    await AdminAudit.log({
      staffAccountId: inviterId,
      action: 'staff.invited',
      targetType: 'staff',
      targetId: staff.id,
    })

    const isProduction = this.config.get<string>('NODE_ENV') === 'production'
    return isProduction
      ? { staffId: staff.id, email: staff.email }
      : { staffId: staff.id, email: staff.email, inviteToken, setupUrl }
  }

  async list() {
    const staff = await StaffAccounts.list()
    return staff.map(s => ({
      id: s.id,
      email: s.email,
      name: s.name,
      isSuperAdmin: s.isSuperAdmin,
      status: s.status,
      roles: s.roles.map(r => r.role.key),
      lastLoginAt: s.lastLoginAt,
      createdAt: s.createdAt,
    }))
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
    }))
  }

  async assignRole(actorId: string, staffId: string, roleKey: string) {
    const staff = await StaffAccounts.findById(staffId)
    if (!staff) throw new NotFoundException('staff.errors.account_not_found')
    const role = await StaffRoles.findByKey(roleKey)
    if (!role) throw new NotFoundException('staff.errors.role_not_found')

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
}
