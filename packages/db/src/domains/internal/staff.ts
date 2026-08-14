import { Prisma } from '@prisma/generated'
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

  async list() {
    return db.staffRole.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: { include: { permission: true } } },
    })
  },
}

export const AdminAudit = {
  async log(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    return db.adminAuditLog.create({ data })
  },
}
