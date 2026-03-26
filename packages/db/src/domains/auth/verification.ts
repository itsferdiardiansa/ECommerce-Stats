import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const Verification = {
  async createToken(data: Prisma.VerificationTokenUncheckedCreateInput) {
    return db.verificationToken.create({ data })
  },

  async findToken(identifier: string, token: string) {
    return db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    })
  },

  async deleteToken(identifier: string, token: string) {
    return db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    })
  },

  async createTwoFactorToken(data: Prisma.TwoFactorTokenUncheckedCreateInput) {
    return db.twoFactorToken.create({ data })
  },

  async findTwoFactorToken(email: string, token: string) {
    return db.twoFactorToken.findUnique({
      where: {
        email_token: {
          email,
          token,
        },
      },
    })
  },

  async deleteTwoFactorToken(id: string) {
    return db.twoFactorToken.delete({
      where: { id },
    })
  },

  async deleteTwoFactorTokenByEmail(email: string) {
    return db.twoFactorToken.deleteMany({
      where: { email },
    })
  },

  async createTwoFactorConfirmation(userId: number) {
    return db.twoFactorConfirmation.create({
      data: { userId },
    })
  },

  async findTwoFactorConfirmation(userId: number) {
    return db.twoFactorConfirmation.findUnique({
      where: { userId },
    })
  },

  async deleteTwoFactorConfirmation(userId: number) {
    return db.twoFactorConfirmation.delete({
      where: { userId },
    })
  },

  async createVerificationLockout(
    data: Prisma.VerificationLockoutUncheckedCreateInput
  ) {
    return db.verificationLockout.create({ data })
  },

  async findActiveVerificationLockout(email: string) {
    return db.verificationLockout.findFirst({
      where: {
        email: email.toLowerCase(),
        expires: {
          gt: new Date(),
        },
        clearedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  async clearVerificationLockout(id: number, clearedBy?: number) {
    return db.verificationLockout.update({
      where: { id },
      data: {
        clearedAt: new Date(),
        clearedBy,
      },
    })
  },

  async clearAllActiveLocksForEmail(email: string, clearedBy?: number) {
    return db.verificationLockout.updateMany({
      where: {
        email: email.toLowerCase(),
        clearedAt: null,
        expires: { gt: new Date() },
      },
      data: {
        clearedAt: new Date(),
        clearedBy,
      },
    })
  },

  async deleteExpiredVerificationLockouts() {
    return db.verificationLockout.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    })
  },

  async listVerificationLockouts(params: {
    page: number
    limit: number
    status?: 'active' | 'cleared' | 'all'
    email?: string
    reason?: 'TOO_MANY_ATTEMPTS' | 'SUSPICIOUS_ACTIVITY' | 'MANUAL_LOCK'
    startDate?: Date
    endDate?: Date
    sortBy?: 'lockedAt' | 'expires' | 'email'
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page,
      limit,
      status = 'active',
      email,
      reason,
      startDate,
      endDate,
      sortBy = 'lockedAt',
      sortOrder = 'desc',
    } = params

    const skip = (page - 1) * limit

    const where: Prisma.VerificationLockoutWhereInput = {}

    if (status === 'active') {
      where.expires = { gt: new Date() }
      where.clearedAt = null
    } else if (status === 'cleared') {
      where.clearedAt = { not: null }
    }

    if (email) {
      where.email = email.toLowerCase()
    }

    if (reason) {
      where.reason = reason
    }

    if (startDate || endDate) {
      where.lockedAt = {}
      if (startDate) {
        where.lockedAt.gte = startDate
      }
      if (endDate) {
        where.lockedAt.lte = endDate
      }
    }

    const [lockouts, total] = await Promise.all([
      db.verificationLockout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      db.verificationLockout.count({ where }),
    ])

    return {
      data: lockouts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async findVerificationLockoutById(id: number) {
    return db.verificationLockout.findUnique({
      where: { id },
    })
  },

  async findVerificationLockoutByEmail(email: string) {
    return db.verificationLockout.findFirst({
      where: {
        email: email.toLowerCase(),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },
}
