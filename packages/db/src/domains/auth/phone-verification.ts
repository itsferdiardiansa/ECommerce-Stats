import { db } from '@/libs/prisma'

export const PhoneVerification = {
  async findActiveLockout(phone: string) {
    return db.phoneLockout.findFirst({
      where: {
        phone,
        expires: { gt: new Date() },
        clearedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async createLockout(data: {
    phone: string
    reason?: 'TOO_MANY_ATTEMPTS' | 'SUSPICIOUS_ACTIVITY' | 'MANUAL_LOCK'
    ipAddress?: string
    userAgent?: string
    expires: Date
  }) {
    return db.phoneLockout.create({
      data: {
        phone: data.phone,
        reason: data.reason ?? 'TOO_MANY_ATTEMPTS',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        lockedAt: new Date(),
        expires: data.expires,
      },
    })
  },

  async clearActiveLockout(phone: string) {
    return db.phoneLockout.updateMany({
      where: {
        phone,
        clearedAt: null,
        expires: { gt: new Date() },
      },
      data: { clearedAt: new Date() },
    })
  },
}
