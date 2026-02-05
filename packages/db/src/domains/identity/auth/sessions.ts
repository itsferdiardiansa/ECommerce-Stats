import { Prisma } from '@prisma/generated'
import { getDb } from '@/libs/prisma'

export const Sessions = {
  async create(data: Prisma.SessionUncheckedCreateInput) {
    const db = getDb()
    return db.session.create({ data })
  },

  async findByToken(sessionToken: string) {
    const db = getDb()
    return db.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    })
  },

  async findById(id: string) {
    const db = getDb()
    return db.session.findUnique({
      where: { id },
    })
  },

  async findMany(params: {
    skip?: number
    take?: number
    cursor?: Prisma.SessionWhereUniqueInput
    where?: Prisma.SessionWhereInput
    orderBy?: Prisma.SessionOrderByWithRelationInput
  }) {
    const db = getDb()
    const { skip, take, cursor, where, orderBy } = params
    return db.session.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    })
  },

  async update(params: {
    where: Prisma.SessionWhereUniqueInput
    data: Prisma.SessionUpdateInput
  }) {
    const db = getDb()
    const { where, data } = params
    return db.session.update({
      data,
      where,
    })
  },

  async delete(sessionToken: string) {
    const db = getDb()
    return db.session.delete({
      where: { sessionToken },
    })
  },

  async deleteByUser(userId: number) {
    const db = getDb()
    return db.session.deleteMany({
      where: { userId },
    })
  },
}
