import { db } from '@/libs/prisma'

export const Totp = {
  async enrol(userId: number, secret: string) {
    const now = new Date()
    return db.userTotp.upsert({
      where: { userId },
      create: { userId, secret, confirmedAt: now, lastUsedAt: now },
      update: { secret, confirmedAt: now, lastUsedAt: now },
    })
  },

  async findByUser(userId: number) {
    return db.userTotp.findUnique({ where: { userId } })
  },

  async findConfirmed(userId: number) {
    return db.userTotp.findFirst({
      where: { userId, confirmedAt: { not: null } },
    })
  },

  async touchLastUsed(userId: number) {
    return db.userTotp.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    })
  },

  async deleteByUser(userId: number) {
    return db.userTotp.deleteMany({ where: { userId } })
  },
}
