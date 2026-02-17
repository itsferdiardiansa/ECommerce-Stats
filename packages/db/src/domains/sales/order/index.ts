import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { CreateOrderInput, OrderFilterParams, UpdateOrderInput } from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createOrder(data: CreateOrderInput) {
  if (!data.orderNumber) {
    data.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }
  return db.order.create({ data })
}

export async function getOrderById(id: number) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      user: true,
      shippingAddress: true,
    },
  })
}

export async function updateOrder(id: number, data: UpdateOrderInput) {
  return db.order.update({ where: { id }, data })
}

export async function deleteOrder(id: number) {
  return db.order.delete({ where: { id } })
}

export async function listOrders(
  params: OrderFilterParams = {}
): Promise<
  PaginatedResult<
    Prisma.OrderGetPayload<{ include: { user: true; items: true } }>
  >
> {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    userId,
    fromDate,
    toDate,
    minTotal,
    maxTotal,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.OrderWhereInput = {}

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      {
        user: {
          OR: [{ email: { contains: search } }, { name: { contains: search } }],
        },
      },
    ]
  }

  if (status) where.status = status
  if (userId) where.userId = userId

  if (fromDate || toDate) {
    where.createdAt = {}
    if (fromDate) where.createdAt.gte = new Date(fromDate)
    if (toDate) where.createdAt.lte = new Date(toDate)
  }

  if (minTotal !== undefined || maxTotal !== undefined) {
    where.grandTotal = {}
    if (minTotal !== undefined) where.grandTotal.gte = minTotal
    if (maxTotal !== undefined) where.grandTotal.lte = maxTotal
  }

  const [total, data] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: true,
        items: true,
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
  }
}
