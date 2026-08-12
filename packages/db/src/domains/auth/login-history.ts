import { Prisma, LoginReason } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const LoginLogs = {
  async logAttempt(data: Prisma.LoginHistoryUncheckedCreateInput) {
    return db.loginHistory.create({ data })
  },

  async logSuccess(
    userId: number,
    metadata?: {
      ip?: string
      agent?: string
      deviceFingerprint?: string
      city?: string
      country?: string
      latitude?: number | null
      longitude?: number | null
    }
  ) {
    return db.loginHistory.create({
      data: {
        userId,
        isSuccess: true,
        reason: LoginReason.SUCCESS,
        ipAddress: metadata?.ip,
        userAgent: metadata?.agent,
        deviceFingerprint: metadata?.deviceFingerprint,
        city: metadata?.city,
        country: metadata?.country,
        latitude: metadata?.latitude ?? null,
        longitude: metadata?.longitude ?? null,
      },
    })
  },

  async logFailure(
    reason: LoginReason,
    metadata?: {
      userId?: number | null
      attemptedEmail?: string
      ip?: string
      agent?: string
    }
  ) {
    return db.loginHistory.create({
      data: {
        userId: metadata?.userId ?? null,
        isSuccess: false,
        reason,
        attemptedEmail: metadata?.attemptedEmail,
        ipAddress: metadata?.ip,
        userAgent: metadata?.agent,
      },
    })
  },

  /**
   * True if the user has ever logged in successfully from this exact device
   * fingerprint - the basis for "new device" detection.
   */
  async hasSeenDevice(
    userId: number,
    deviceFingerprint: string
  ): Promise<boolean> {
    const count = await db.loginHistory.count({
      where: { userId, isSuccess: true, deviceFingerprint },
    })
    return count > 0
  },

  /** True if the user has ever logged in successfully from this country. */
  async hasSeenCountry(userId: number, country: string): Promise<boolean> {
    const count = await db.loginHistory.count({
      where: { userId, isSuccess: true, country },
    })
    return count > 0
  },

  /** Most recent successful login that carried geo coordinates. */
  async lastSuccessWithGeo(userId: number) {
    return db.loginHistory.findFirst({
      where: {
        userId,
        isSuccess: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Counts recent failed attempts, by user and/or by IP, for brute-force /
   * credential-stuffing detection.
   */
  async countRecentFailures(params: {
    userId?: number | null
    ipAddress?: string | null
    minutes?: number
  }): Promise<number> {
    const { userId, ipAddress, minutes = 15 } = params
    const since = new Date(Date.now() - minutes * 60 * 1000)

    const or: Prisma.LoginHistoryWhereInput[] = []
    if (userId != null) or.push({ userId })
    if (ipAddress) or.push({ ipAddress })
    if (or.length === 0) return 0

    return db.loginHistory.count({
      where: { isSuccess: false, createdAt: { gte: since }, OR: or },
    })
  },

  async findMany(params: {
    skip?: number
    take?: number
    cursor?: Prisma.LoginHistoryWhereUniqueInput
    where?: Prisma.LoginHistoryWhereInput
    orderBy?: Prisma.LoginHistoryOrderByWithRelationInput
  }) {
    const { skip, take, cursor, where, orderBy } = params
    return db.loginHistory.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    })
  },

  async countForUser(userId: number, since?: Date) {
    return db.loginHistory.count({
      where: { userId, ...(since ? { createdAt: { gte: since } } : {}) },
    })
  },

  async getRecentAttempts(userId: number, minutes = 15) {
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

  async deleteOlderThan(days: number): Promise<{ count: number }> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return db.loginHistory.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })
  },
}
