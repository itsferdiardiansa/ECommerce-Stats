import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const Authenticators = {
  async create(data: Prisma.AuthenticatorUncheckedCreateInput) {
    return db.authenticator.create({ data })
  },

  async findByCredentialID(credentialID: string) {
    return db.authenticator.findUnique({
      where: { credentialID },
    })
  },

  async listByUser(userId: number) {
    return db.authenticator.findMany({
      where: { userId },
    })
  },

  async updateCounter(credentialID: string, newCounter: number) {
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
    return db.authenticator.delete({
      where: { credentialID },
    })
  },
}
