import {
  Prisma,
  type StaffStatus,
  type StaffInvitationStatus,
} from '@prisma/generated'
import { db } from '@/libs/prisma'

export const StaffAccounts = {
  async create(data: Prisma.StaffAccountUncheckedCreateInput) {
    return db.staffAccount.create({ data })
  },

  async findByEmail(email: string) {
    return db.staffAccount.findUnique({ where: { email } })
  },

  async findById(id: string) {
    return db.staffAccount.findUnique({ where: { id } })
  },

  async update(id: string, data: Prisma.StaffAccountUncheckedUpdateInput) {
    return db.staffAccount.update({ where: { id }, data })
  },

  async countSuperAdmins() {
    return db.staffAccount.count({ where: { isSuperAdmin: true } })
  },

  async list() {
    return db.staffAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: { roles: { include: { role: true } } },
    })
  },

  async search(params: {
    search?: string
    status?: StaffStatus
    roleKey?: string
    superOnly?: boolean
    skip: number
    take: number
  }) {
    const where: Prisma.StaffAccountWhereInput = {}
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    if (params.status) where.status = params.status
    if (params.superOnly) where.isSuperAdmin = true
    else if (params.roleKey) {
      where.roles = { some: { role: { key: params.roleKey } } }
    }

    const [items, total] = await Promise.all([
      db.staffAccount.findMany({
        where,
        orderBy: [{ isSuperAdmin: 'desc' }, { createdAt: 'desc' }],
        skip: params.skip,
        take: params.take,
        include: { roles: { include: { role: true } } },
      }),
      db.staffAccount.count({ where }),
    ])
    return { items, total }
  },

  async assignRole(
    staffAccountId: string,
    roleId: string,
    assignedById?: string
  ) {
    return db.staffAccountRole.upsert({
      where: { staffAccountId_roleId: { staffAccountId, roleId } },
      update: { assignedById },
      create: { staffAccountId, roleId, assignedById },
    })
  },

  async removeRole(staffAccountId: string, roleId: string) {
    return db.staffAccountRole.deleteMany({
      where: { staffAccountId, roleId },
    })
  },

  async remove(id: string) {
    return db.staffAccount.delete({ where: { id } })
  },
}

export const StaffSessions = {
  async create(data: Prisma.StaffSessionUncheckedCreateInput) {
    return db.staffSession.create({ data })
  },

  async findByJti(jti: string) {
    return db.staffSession.findUnique({ where: { jti } })
  },

  async revokeByJti(jti: string) {
    return db.staffSession.update({ where: { jti }, data: { isRevoked: true } })
  },

  async revokeAllForStaff(staffAccountId: string) {
    return db.staffSession.updateMany({
      where: { staffAccountId, isRevoked: false },
      data: { isRevoked: true },
    })
  },

  async findActiveByStaff(staffAccountId: string) {
    return db.staffSession.findMany({
      where: { staffAccountId, isRevoked: false, expires: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
  },
}

export const StaffTotps = {
  async upsert(staffAccountId: string, secret: string) {
    return db.staffTotp.upsert({
      where: { staffAccountId },
      update: { secret, confirmedAt: null },
      create: { staffAccountId, secret },
    })
  },

  async findByStaff(staffAccountId: string) {
    return db.staffTotp.findUnique({ where: { staffAccountId } })
  },

  async confirm(staffAccountId: string) {
    return db.staffTotp.update({
      where: { staffAccountId },
      data: { confirmedAt: new Date(), lastUsedAt: new Date() },
    })
  },

  async touch(staffAccountId: string) {
    return db.staffTotp.update({
      where: { staffAccountId },
      data: { lastUsedAt: new Date() },
    })
  },
}

export const StaffRoles = {
  async findByKey(key: string) {
    return db.staffRole.findUnique({ where: { key } })
  },

  async findById(id: string) {
    return db.staffRole.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    })
  },

  async list() {
    return db.staffRole.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { members: true } },
      },
    })
  },

  async members(roleId: string) {
    const rows = await db.staffAccountRole.findMany({
      where: { roleId },
      orderBy: { assignedAt: 'desc' },
      include: {
        staffAccount: {
          select: { id: true, email: true, name: true, isSuperAdmin: true },
        },
      },
    })
    return rows.map(r => r.staffAccount)
  },

  async create(input: {
    key: string
    name: string
    description?: string | null
    permissionKeys: string[]
  }) {
    const perms = await db.permission.findMany({
      where: { key: { in: input.permissionKeys } },
      select: { id: true },
    })
    return db.staffRole.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description ?? null,
        isSystem: false,
        permissions: { create: perms.map(p => ({ permissionId: p.id })) },
      },
      include: { permissions: { include: { permission: true } } },
    })
  },

  async update(
    id: string,
    data: { name?: string; description?: string | null }
  ) {
    return db.staffRole.update({ where: { id }, data })
  },

  async setPermissions(id: string, permissionKeys: string[]) {
    const perms = await db.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    })
    return db.$transaction(async tx => {
      await tx.staffRolePermission.deleteMany({ where: { roleId: id } })
      await tx.staffRolePermission.createMany({
        data: perms.map(p => ({ roleId: id, permissionId: p.id })),
        skipDuplicates: true,
      })
      return tx.staffRole.findUnique({
        where: { id },
        include: { permissions: { include: { permission: true } } },
      })
    })
  },

  async remove(id: string) {
    return db.staffRole.delete({ where: { id } })
  },
}

export const AdminAudit = {
  async log(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    return db.adminAuditLog.create({ data })
  },

  async search(params: {
    search?: string
    action?: string
    targetType?: string
    skip: number
    take: number
  }) {
    const where: Prisma.AdminAuditLogWhereInput = {}
    if (params.action) where.action = params.action
    if (params.targetType) where.targetType = params.targetType
    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: 'insensitive' } },
        { targetType: { contains: params.search, mode: 'insensitive' } },
        { targetId: { contains: params.search, mode: 'insensitive' } },
        {
          staffAccount: {
            email: { contains: params.search, mode: 'insensitive' },
          },
        },
        {
          staffAccount: {
            name: { contains: params.search, mode: 'insensitive' },
          },
        },
      ]
    }

    const [rows, total] = await Promise.all([
      db.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: { staffAccount: { select: { email: true, name: true } } },
      }),
      db.adminAuditLog.count({ where }),
    ])

    return {
      items: rows.map(r => ({
        id: r.id,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        metadata: r.metadata,
        actorEmail: r.staffAccount?.email ?? null,
        actorName: r.staffAccount?.name ?? null,
        createdAt: r.createdAt,
      })),
      total,
    }
  },

  async distinctFilters() {
    const [actions, targetTypes] = await Promise.all([
      db.adminAuditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      db.adminAuditLog.findMany({
        distinct: ['targetType'],
        select: { targetType: true },
        where: { targetType: { not: null } },
        orderBy: { targetType: 'asc' },
      }),
    ])
    return {
      actions: actions.map(a => a.action),
      targetTypes: targetTypes
        .map(t => t.targetType)
        .filter((t): t is string => !!t),
    }
  },

  async countInvitesForEmailSince(email: string, since: Date) {
    return db.adminAuditLog.count({
      where: {
        action: { in: ['staff.invited', 'staff.invitation.resent'] },
        createdAt: { gte: since },
        metadata: { path: ['email'], equals: email },
      },
    })
  },
}

const invitationInclude = {
  invitedBy: { select: { email: true, name: true } },
} satisfies Prisma.StaffInvitationInclude

function mapInvitation(
  row: Prisma.StaffInvitationGetPayload<{ include: typeof invitationInclude }>
) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    roleKeys: row.roleKeys,
    expiresAt: row.expiresAt,
    resentAt: row.resentAt,
    resendCount: row.resendCount,
    acceptedAt: row.acceptedAt,
    rejectedAt: row.rejectedAt,
    staffAccountId: row.staffAccountId,
    invitedByEmail: row.invitedBy?.email ?? null,
    invitedByName: row.invitedBy?.name ?? null,
    createdAt: row.createdAt,
  }
}

export const StaffInvitations = {
  async create(data: Prisma.StaffInvitationUncheckedCreateInput) {
    return db.staffInvitation.create({ data })
  },

  async findById(id: string) {
    return db.staffInvitation.findUnique({
      where: { id },
      include: invitationInclude,
    })
  },

  async findActivePendingByEmail(email: string) {
    return db.staffInvitation.findFirst({
      where: { email, status: 'PENDING', expiresAt: { gt: new Date() } },
    })
  },

  /** Materialize PENDING invitations whose deadline has passed as EXPIRED. */
  async sweepExpired() {
    return db.staffInvitation.updateMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    })
  },

  async search(params: {
    search?: string
    status?: StaffInvitationStatus
    skip: number
    take: number
  }) {
    await this.sweepExpired()

    const where: Prisma.StaffInvitationWhereInput = {}
    if (params.status) where.status = params.status
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    const [rows, total] = await Promise.all([
      db.staffInvitation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: invitationInclude,
      }),
      db.staffInvitation.count({ where }),
    ])

    return { items: rows.map(mapInvitation), total }
  },

  async update(id: string, data: Prisma.StaffInvitationUncheckedUpdateInput) {
    return db.staffInvitation.update({ where: { id }, data })
  },

  async markAcceptedByAccount(staffAccountId: string) {
    return db.staffInvitation.updateMany({
      where: { staffAccountId, status: { in: ['PENDING', 'EXPIRED'] } },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
  },
}
