import { db } from '@/libs/prisma'

export const PhoneVerification = {
  async findActiveLockout(phone: string, userId: number) {
    return db.phoneLockout.findFirst({
      where: {
        phone,
        userId,
        expires: { gt: new Date() },
        clearedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async createLockout(data: {
    phone: string
    userId: number
    reason?: 'TOO_MANY_ATTEMPTS' | 'SUSPICIOUS_ACTIVITY' | 'MANUAL_LOCK'
    ipAddress?: string
    userAgent?: string
    expires: Date
  }) {
    return db.phoneLockout.create({
      data: {
        phone: data.phone,
        userId: data.userId,
        reason: data.reason ?? 'TOO_MANY_ATTEMPTS',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        lockedAt: new Date(),
        expires: data.expires,
      },
    })
  },

  async clearActiveLockout(phone: string, userId: number) {
    return db.phoneLockout.updateMany({
      where: {
        phone,
        userId,
        clearedAt: null,
        expires: { gt: new Date() },
      },
      data: { clearedAt: new Date() },
    })
  },
}
