import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { CreateUserInput, UpdateUserInput, UserFilterParams } from './types'
import { PaginatedResult } from '@/types/filters'

export async function createUser(data: CreateUserInput) {
  if (!data?.email || !data.email.includes('@')) {
    throw new Error('Invalid email address')
  }
  return db.user.create({ data })
}

export async function getUserById(id: number) {
  return db.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function updateUser(id: number, data: UpdateUserInput) {
  return db.user.update({ where: { id }, data })
}

export async function deleteUser(id: number) {
  return db.user.delete({ where: { id } })
}

export async function listUsers(
  params: UserFilterParams = {}
): Promise<
  PaginatedResult<Prisma.UserGetPayload<{ include: { addresses: false } }>>
> {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    isActive,
    marketingOptIn,
    tierLevel,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.UserWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (isActive !== undefined) where.isActive = isActive

  if (marketingOptIn !== undefined || tierLevel) {
    where.profile = {}
    if (marketingOptIn !== undefined)
      where.profile.marketingOptIn = marketingOptIn
    if (tierLevel) where.profile.tierLevel = tierLevel
  }

  const [total, data] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
    }),
  ])

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  }
}
