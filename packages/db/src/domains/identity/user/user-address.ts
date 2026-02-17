import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  UserAddressFilterParams,
  CreateUserAddressInput,
  UpdateUserAddressInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createUserAddress(data: CreateUserAddressInput) {
  if (data.isDefault) {
    await db.userAddress.updateMany({
      where: {
        userId: data.user.connect?.id ?? data.user.connectOrCreate?.where.id,
      },
      data: { isDefault: false },
    })
  }

  return db.userAddress.create({ data })
}

export async function setUserAddressAsDefault(id: number, userId: number) {
  return db.$transaction([
    db.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    db.userAddress.update({
      where: { id },
      data: { isDefault: true },
    }),
  ])
}

export async function getUserAddressById(id: number) {
  return db.userAddress.findUnique({ where: { id } })
}

export async function updateUserAddress(
  id: number,
  data: UpdateUserAddressInput
) {
  return db.userAddress.update({ where: { id }, data })
}

export async function deleteUserAddress(id: number) {
  return db.userAddress.delete({ where: { id } })
}

export async function listUserAddresses(
  params: UserAddressFilterParams = {}
): Promise<PaginatedResult<Prisma.UserAddressGetPayload<object>>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    userId,
    type,
    isDefault,
    country,
    search,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.UserAddressWhereInput = {}

  if (userId) where.userId = userId
  if (type) where.type = type
  if (isDefault !== undefined) where.isDefault = isDefault
  if (country) where.country = country

  if (search) {
    where.OR = [
      { city: { contains: search, mode: 'insensitive' } },
      { street1: { contains: search, mode: 'insensitive' } },
      { label: { contains: search, mode: 'insensitive' } },
      { postalCode: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, data] = await Promise.all([
    db.userAddress.count({ where }),
    db.userAddress.findMany({
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
