import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const OAuthAccounts = {
  async create(data: Prisma.OAuthAccountUncheckedCreateInput) {
    return db.oAuthAccount.create({ data })
  },

  async findByProvider(provider: string, providerAccountId: string) {
    return db.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    })
  },

  async findMany(params: {
    skip?: number
    take?: number
    cursor?: Prisma.OAuthAccountWhereUniqueInput
    where?: Prisma.OAuthAccountWhereInput
    orderBy?: Prisma.OAuthAccountOrderByWithRelationInput
  }) {
    const { skip, take, cursor, where, orderBy } = params
    return db.oAuthAccount.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    })
  },

  async update(params: {
    where: Prisma.OAuthAccountWhereUniqueInput
    data: Prisma.OAuthAccountUpdateInput
  }) {
    const { where, data } = params
    return db.oAuthAccount.update({
      data,
      where,
    })
  },

  async delete(where: Prisma.OAuthAccountWhereUniqueInput) {
    return db.oAuthAccount.delete({ where })
  },

  async unlinkProvider(userId: number, provider: string) {
    const account = await db.oAuthAccount.findFirst({
      where: {
        userId,
        provider,
      },
    })

    if (!account) return null

    return db.oAuthAccount.delete({
      where: { id: account.id },
    })
  },
}
