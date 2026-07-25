import { db } from '@/libs/prisma'

export const RecoveryCodes = {
  async replaceAll(userId: number, codeHashes: string[]) {
    return db.$transaction([
      db.recoveryCode.deleteMany({ where: { userId } }),
      db.recoveryCode.createMany({
        data: codeHashes.map(codeHash => ({ userId, codeHash })),
      }),
    ])
  },

  async listUnused(userId: number) {
    return db.recoveryCode.findMany({
      where: { userId, usedAt: null },
      orderBy: { createdAt: 'asc' },
    })
  },

  async countUnused(userId: number) {
    return db.recoveryCode.count({ where: { userId, usedAt: null } })
  },

  async markUsed(id: string) {
    return db.recoveryCode.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    })
  },

  async deleteByUser(userId: number) {
    return db.recoveryCode.deleteMany({ where: { userId } })
  },
}
