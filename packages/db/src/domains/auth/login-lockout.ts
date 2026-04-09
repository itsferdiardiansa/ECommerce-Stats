import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const LoginLockouts = {
  async create(data: {
    email: string
    ipAddress?: string
    userAgent?: string
    lockedAt: Date
    expires: Date
    reason?: 'TOO_MANY_ATTEMPTS' | 'SUSPICIOUS_ACTIVITY' | 'MANUAL_LOCK'
  }) {
    return db.loginLockout.create({ data })
  },

  async findActive(email: string) {
    return db.loginLockout.findFirst({
      where: {
        email: email.toLowerCase(),
        expires: { gt: new Date() },
        clearedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async clear(id: number, clearedBy?: number) {
    return db.loginLockout.update({
      where: { id },
      data: { clearedAt: new Date(), clearedBy },
    })
  },

  async clearAllForEmail(email: string, clearedBy?: number) {
    return db.loginLockout.updateMany({
      where: {
        email: email.toLowerCase(),
        clearedAt: null,
        expires: { gt: new Date() },
      },
      data: { clearedAt: new Date(), clearedBy },
    })
  },

  async findById(id: number) {
    return db.loginLockout.findUnique({ where: { id } })
  },

  async list(params: {
    page: number
    limit: number
    status?: 'active' | 'cleared' | 'all'
    email?: string
    startDate?: Date
    endDate?: Date
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page,
      limit,
      status = 'active',
      email,
      startDate,
      endDate,
      sortOrder = 'desc',
    } = params

    const where: Prisma.LoginLockoutWhereInput = {}

    if (status === 'active') {
      where.expires = { gt: new Date() }
      where.clearedAt = null
    } else if (status === 'cleared') {
      where.clearedAt = { not: null }
    }

    if (email) where.email = email.toLowerCase()

    if (startDate || endDate) {
      where.lockedAt = {}
      if (startDate) where.lockedAt.gte = startDate
      if (endDate) where.lockedAt.lte = endDate
    }

    const [lockouts, total] = await Promise.all([
      db.loginLockout.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lockedAt: sortOrder },
      }),
      db.loginLockout.count({ where }),
    ])

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }

    return { data: lockouts, meta }
  },

  async countAllForEmail(email: string) {
    return db.loginLockout.count({
      where: { email: email.toLowerCase() },
    })
  },

  async deleteExpired() {
    return db.loginLockout.deleteMany({
      where: { expires: { lt: new Date() } },
    })
  },
}
