import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { PriceHistoryFilterParams, CreatePriceHistoryInput } from './types.js'
import { PaginatedResult } from '@/types/filters'

export * from './types.js'

export async function createPriceHistory(data: CreatePriceHistoryInput) {
  return db.priceHistory.create({ data })
}

export async function listPriceHistory(
  params: PriceHistoryFilterParams = {}
): Promise<
  PaginatedResult<Prisma.PriceHistoryGetPayload<{ include: { product: true } }>>
> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'effectiveAt',
    sortOrder = 'desc',
    productId,
    reason,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.PriceHistoryWhereInput = {}

  if (productId) where.productId = productId
  if (reason) where.reason = reason

  const [total, data] = await Promise.all([
    db.priceHistory.count({ where }),
    db.priceHistory.findMany({
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
