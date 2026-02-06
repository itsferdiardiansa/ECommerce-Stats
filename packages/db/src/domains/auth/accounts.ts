import { Prisma } from '@prisma/generated'
import { getDb } from '@/libs/prisma'

export const Accounts = {
  async create(data: Prisma.AccountUncheckedCreateInput) {
    const db = getDb()
    return db.account.create({ data })
  },

  async findByProvider(provider: string, providerAccountId: string) {
    const db = getDb()
    return db.account.findUnique({
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
    cursor?: Prisma.AccountWhereUniqueInput
    where?: Prisma.AccountWhereInput
    orderBy?: Prisma.AccountOrderByWithRelationInput
  }) {
    const db = getDb()
    const { skip, take, cursor, where, orderBy } = params
    return db.account.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    })
  },

  async update(params: {
    where: Prisma.AccountWhereUniqueInput
    data: Prisma.AccountUpdateInput
  }) {
    const db = getDb()
    const { where, data } = params
    return db.account.update({
      data,
      where,
    })
  },

  async delete(where: Prisma.AccountWhereUniqueInput) {
    const db = getDb()
    return db.account.delete({ where })
  },

  async unlinkProvider(userId: number, provider: string) {
    const db = getDb()
    const account = await db.account.findFirst({
      where: {
        userId,
        provider,
      },
    })

    if (!account) return null

    return db.account.delete({
      where: { id: account.id },
    })
  },
}
