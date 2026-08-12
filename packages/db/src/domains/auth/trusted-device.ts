import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const TrustedDevices = {
  async create(data: Prisma.TrustedDeviceUncheckedCreateInput) {
    return db.trustedDevice.create({ data })
  },

  /** Look up a non-expired trusted device by its token hash. */
  async findValidByTokenHash(tokenHash: string) {
    return db.trustedDevice.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    })
  },

  /** Non-expired trusted devices for a user (for the settings list). */
  async listByUser(userId: number) {
    return db.trustedDevice.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
    })
  },

  async touchLastUsed(id: string) {
    return db.trustedDevice.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    })
  },

  /** Revoke a single trusted device the user owns; returns it (for cache eviction). */
  async revokeById(userId: number, id: string) {
    const record = await db.trustedDevice.findFirst({ where: { id, userId } })
    if (!record) return null
    await db.trustedDevice.delete({ where: { id } })
    return record
  },

  /**
   * Revoke every trusted device matching these device fingerprints (used when a
   * session is revoked - the device is no longer trusted). Returns the removed
   * records so callers can evict their token hashes from the cache.
   */
  async revokeByFingerprints(userId: number, fingerprints: string[]) {
    if (fingerprints.length === 0) return []
    const records = await db.trustedDevice.findMany({
      where: { userId, deviceFingerprint: { in: fingerprints } },
    })
    if (records.length > 0) {
      await db.trustedDevice.deleteMany({
        where: { userId, deviceFingerprint: { in: fingerprints } },
      })
    }
    return records
  },

  async revokeAllByUser(userId: number) {
    const records = await db.trustedDevice.findMany({ where: { userId } })
    await db.trustedDevice.deleteMany({ where: { userId } })
    return records
  },

  async deleteExpired(): Promise<{ count: number }> {
    const res = await db.trustedDevice.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    return { count: res.count }
  },
}
