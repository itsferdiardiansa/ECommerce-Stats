import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  ProductVariantFilterParams,
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export async function createProductVariant(data: CreateProductVariantInput) {
  return db.productVariant.create({ data })
}

export async function getProductVariantById(id: number) {
  return db.productVariant.findUnique({
    where: { id },
    include: { product: true },
  })
}

export async function getProductVariantBySku(sku: string) {
  return db.productVariant.findUnique({
    where: { sku },
    include: { product: true },
  })
}

export async function updateProductVariant(
  id: number,
  data: UpdateProductVariantInput
) {
  return db.productVariant.update({ where: { id }, data })
}

export async function deleteProductVariant(id: number) {
  return db.productVariant.delete({ where: { id } })
}

export async function listProductVariants(
  params: ProductVariantFilterParams = {}
): Promise<
  PaginatedResult<
    Prisma.ProductVariantGetPayload<{ include: { product: true } }>
  >
> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    productId,
    sku,
    isActive,
    search,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.ProductVariantWhereInput = {}

  if (productId) where.productId = productId
  if (sku) where.sku = sku
  if (isActive !== undefined) where.isActive = isActive

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, data] = await Promise.all([
    db.productVariant.count({ where }),
    db.productVariant.findMany({
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
