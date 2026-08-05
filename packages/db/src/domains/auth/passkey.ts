import { db } from '@/libs/prisma'

export interface CreatePasskeyInput {
  userId: number
  credentialId: string
  publicKey: string
  counter: bigint
  deviceType: string
  backedUp: boolean
  transports: string[]
  userHandle: string
  name?: string | null
  aaguid?: string | null
}

export const Passkeys = {
  async create(data: CreatePasskeyInput) {
    return db.passkey.create({ data })
  },

  async findByCredentialId(credentialId: string) {
    return db.passkey.findUnique({ where: { credentialId } })
  },

  async listByUser(userId: number) {
    return db.passkey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async countByUser(userId: number) {
    return db.passkey.count({ where: { userId } })
  },

  async updateCounterAndUsed(
    credentialId: string,
    counter: bigint,
    device?: string
  ) {
    return db.passkey.update({
      where: { credentialId },
      data: {
        counter,
        lastUsedAt: new Date(),
        ...(device ? { lastUsedDevice: device } : {}),
      },
    })
  },

  async rename(id: string, userId: number, name: string) {
    return db.passkey.updateMany({
      where: { id, userId },
      data: { name },
    })
  },

  async deleteById(id: string, userId: number) {
    return db.passkey.deleteMany({ where: { id, userId } })
  },

  async deleteByUser(userId: number) {
    return db.passkey.deleteMany({ where: { userId } })
  },
}
