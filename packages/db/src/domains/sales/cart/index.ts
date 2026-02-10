import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { CartFilterParams, CreateCartInput, UpdateCartInput } from './types.js'
import { PaginatedResult } from '@/types/filters'

export * from './types.js'

export async function createCart(data: CreateCartInput) {
  if (!data.token) {
    data.token =
      Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
  return db.cart.create({ data })
}

export async function getCartById(id: number) {
  return db.cart.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
    },
  })
}

export async function getCartByToken(token: string) {
  return db.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
    },
  })
}

export async function updateCart(id: number, data: UpdateCartInput) {
  return db.cart.update({ where: { id }, data })
}

export async function deleteCart(id: number) {
  return db.cart.delete({ where: { id } })
}

export async function listCarts(
  params: CartFilterParams = {}
): Promise<
  PaginatedResult<Prisma.CartGetPayload<{ include: { _count: true } }>>
> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    userId,
    sessionId,
    status,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.CartWhereInput = {}

  if (userId) where.userId = userId
  if (sessionId) where.sessionId = sessionId
  if (status) where.status = status

  const [total, data] = await Promise.all([
    db.cart.count({ where }),
    db.cart.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { items: true } },
      },
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
  } as unknown as PaginatedResult<
    Prisma.CartGetPayload<{ include: { _count: true } }>
  >
}
