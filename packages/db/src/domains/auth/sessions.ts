import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const Sessions = {
  async create(data: Prisma.SessionUncheckedCreateInput) {
    return db.session.create({ data })
  },

  async upsertByFingerprint(data: Prisma.SessionUncheckedCreateInput) {
    if (!data.deviceFingerprint) {
      throw new Error('deviceFingerprint is required for upsertByFingerprint')
    }

    return db.session.upsert({
      where: {
        userId_deviceFingerprint: {
          userId: data.userId,
          deviceFingerprint: data.deviceFingerprint,
        },
      },
      update: {
        jti: data.jti,
        refreshTokenHash: data.refreshTokenHash,
        expires: data.expires,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        lastUsedAt: new Date(),
        isRevoked: false,
      },
      create: data,
    })
  },

  async findByFingerprint(userId: number, deviceFingerprint: string) {
    return db.session.findUnique({
      where: {
        userId_deviceFingerprint: { userId, deviceFingerprint },
      },
    })
  },

  async findByJti(jti: string) {
    return db.session.findUnique({
      where: { jti },
    })
  },

  async findActiveByUserId(userId: number) {
    return db.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expires: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async revokeByJti(jti: string) {
    return db.session.update({
      where: { jti },
      data: { isRevoked: true },
    })
  },

  async revokeAllByUserId(userId: number): Promise<void> {
    await db.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    })
  },

  async revokeAllExceptJti(userId: number, jti: string): Promise<void> {
    await db.session.updateMany({
      where: {
        userId,
        isRevoked: false,
        jti: { not: jti },
      },
      data: { isRevoked: true },
    })
  },

  async updateLastUsed(jti: string) {
    return db.session.update({
      where: { jti },
      data: { lastUsedAt: new Date() },
    })
  },

  async deleteExpired(olderThanDays = 30): Promise<{ count: number }> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - olderThanDays)

    const result = await db.session.deleteMany({
      where: {
        OR: [
          { expires: { lt: cutoff } },
          { isRevoked: true, createdAt: { lt: cutoff } },
        ],
      },
    })

    return { count: result.count }
  },

  async findMany(params: {
    skip?: number
    take?: number
    cursor?: Prisma.SessionWhereUniqueInput
    where?: Prisma.SessionWhereInput
    orderBy?: Prisma.SessionOrderByWithRelationInput
  }) {
    const { skip, take, cursor, where, orderBy } = params
    return db.session.findMany({ skip, take, cursor, where, orderBy })
  },
}
