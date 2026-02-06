import { Prisma, LoginReason } from '@prisma/generated'
import { getDb } from '@/libs/prisma'

export const LoginLogs = {
  async logAttempt(data: Prisma.LoginHistoryUncheckedCreateInput) {
    const db = getDb()
    return db.loginHistory.create({ data })
  },

  async logSuccess(
    userId: number,
    metadata?: { ip?: string; agent?: string; city?: string; country?: string }
  ) {
    const db = getDb()
    return db.loginHistory.create({
      data: {
        userId,
        isSuccess: true,
        reason: LoginReason.SUCCESS,
        ipAddress: metadata?.ip,
        userAgent: metadata?.agent,
        city: metadata?.city,
        country: metadata?.country,
      },
    })
  },

  async logFailure(
    userId: number,
    reason: LoginReason,
    metadata?: { ip?: string; agent?: string }
  ) {
    const db = getDb()
    return db.loginHistory.create({
      data: {
        userId,
        isSuccess: false,
        reason,
        ipAddress: metadata?.ip,
        userAgent: metadata?.agent,
      },
    })
  },

  async findMany(params: {
    skip?: number
    take?: number
    cursor?: Prisma.LoginHistoryWhereUniqueInput
    where?: Prisma.LoginHistoryWhereInput
    orderBy?: Prisma.LoginHistoryOrderByWithRelationInput
  }) {
    const db = getDb()
    const { skip, take, cursor, where, orderBy } = params
    return db.loginHistory.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    })
  },

  async getRecentAttempts(userId: number, minutes = 15) {
    const db = getDb()
    const since = new Date(Date.now() - minutes * 60 * 1000)

    return db.loginHistory.findMany({
      where: {
        userId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },
}
