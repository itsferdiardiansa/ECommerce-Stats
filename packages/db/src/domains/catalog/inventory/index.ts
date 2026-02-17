import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { InventoryLogFilterParams, CreateInventoryLogInput } from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createInventoryLog(data: CreateInventoryLogInput) {
  return db.inventoryLog.create({ data })
}

export async function listInventoryLogs(
  params: InventoryLogFilterParams = {}
): Promise<
  PaginatedResult<Prisma.InventoryLogGetPayload<{ include: { product: true } }>>
> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    productId,
    reason,
    userId,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.InventoryLogWhereInput = {}

  if (productId) where.productId = productId
  if (reason) where.reason = reason
  if (userId) where.userId = userId

  const [total, data] = await Promise.all([
    db.inventoryLog.count({ where }),
    db.inventoryLog.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        product: true,
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
