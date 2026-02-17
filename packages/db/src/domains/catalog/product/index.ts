import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  CreateProductInput,
  ProductFilterParams,
  UpdateProductInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createProduct(data: CreateProductInput) {
  if (Number(data.price) < 0) {
    throw new Error('Price cannot be negative')
  }
  return db.product.create({ data })
}

export async function getProductById(id: number) {
  return db.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      images: true,
      variants: true,
    },
  })
}

export async function updateProduct(id: number, data: UpdateProductInput) {
  return db.product.update({ where: { id }, data })
}

export async function deleteProduct(id: number) {
  return db.product.delete({ where: { id } })
}

export async function listProducts(params: ProductFilterParams = {}): Promise<
  PaginatedResult<
    Prisma.ProductGetPayload<{
      include: { category: true; brand: true; images: true }
    }>
  >
> {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minPrice,
    maxPrice,
    categoryId,
    brandId,
    isActive,
    inStock,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.ProductWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }

  if (categoryId !== undefined) where.categoryId = categoryId
  if (brandId !== undefined) where.brandId = brandId
  if (isActive !== undefined) where.isActive = isActive

  if (inStock === true) {
    where.stockQuantity = { gt: 0 }
  } else if (inStock === false) {
    where.stockQuantity = 0
  }

  const [total, data] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: true,
        brand: true,
        images: true,
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
