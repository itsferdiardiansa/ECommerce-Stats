import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const PasswordSecurity = {
  async archivePassword(userId: number, passwordHash: string) {
    return db.passwordHistory.create({
      data: {
        userId,
        password: passwordHash,
      },
    })
  },

  async getRecentPasswords(userId: number, limit = 5) {
    return db.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { password: true },
    })
  },

  async findMany(params: {
    skip?: number
    take?: number
    cursor?: Prisma.PasswordHistoryWhereUniqueInput
    where?: Prisma.PasswordHistoryWhereInput
    orderBy?: Prisma.PasswordHistoryOrderByWithRelationInput
  }) {
    const { skip, take, cursor, where, orderBy } = params
    return db.passwordHistory.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    })
  },
}
