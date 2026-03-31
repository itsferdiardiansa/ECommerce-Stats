import { db } from '@/libs/prisma'
import { Prisma, Role } from '@prisma/generated'

export type CreateOrganizationMemberInput = Prisma.OrganizationMemberUncheckedCreateInput

export const OrganizationMembers = {
  async addMember(data: CreateOrganizationMemberInput) {
    return db.organizationMember.create({
      data,
    })
  },

  async findByOrgAndUser(organizationId: string, userId: number) {
    return db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        organization: true,
      },
    })
  },

  async listByUser(userId: number) {
    return db.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: 'desc' },
    })
  },

  async listByOrg(organizationId: string) {
    return db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })
  },

  async updateRole(organizationId: string, userId: number, role: Role) {
    return db.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: { role },
    })
  },

  async removeMember(organizationId: string, userId: number) {
    return db.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    })
  },
}
