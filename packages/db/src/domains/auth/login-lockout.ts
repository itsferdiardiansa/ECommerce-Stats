import { db } from '@/libs/prisma'

export const LoginLockouts = {
  async create(data: {
    email: string
    ipAddress?: string
    userAgent?: string
    lockedAt: Date
    expires: Date
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

  /**
   * Count all lockout records for an email, including expired and cleared ones.
   * Used to determine how many times this account has been locked, which drives
   * progressive lockout durations.
   */
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
