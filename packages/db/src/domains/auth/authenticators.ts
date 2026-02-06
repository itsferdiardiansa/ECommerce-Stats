import { Prisma } from '@prisma/generated'
import { getDb } from '@/libs/prisma'

export const Authenticators = {
  async create(data: Prisma.AuthenticatorUncheckedCreateInput) {
    const db = getDb()
    return db.authenticator.create({ data })
  },

  async findByCredentialID(credentialID: string) {
    const db = getDb()
    return db.authenticator.findUnique({
      where: { credentialID },
    })
  },

  async listByUser(userId: number) {
    const db = getDb()
    return db.authenticator.findMany({
      where: { userId },
    })
  },

  async updateCounter(credentialID: string, newCounter: number) {
    const db = getDb()
    return db.authenticator.update({
      where: { credentialID },
      data: {
        counter: newCounter,
      },
    })
  },

  async findMany(params: {
    skip?: number
    take?: number
    cursor?: Prisma.AuthenticatorWhereUniqueInput
    where?: Prisma.AuthenticatorWhereInput
    orderBy?: Prisma.AuthenticatorOrderByWithRelationInput
  }) {
    const db = getDb()
    const { skip, take, cursor, where, orderBy } = params
    return db.authenticator.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    })
  },

  async delete(credentialID: string) {
    const db = getDb()
    return db.authenticator.delete({
      where: { credentialID },
    })
  },
}
