import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { BrandFilterParams, CreateBrandInput, UpdateBrandInput } from './types'
import { PaginatedResult } from '@/types/filters'

export async function createBrand(data: CreateBrandInput) {
  if (!data.slug && data.name) {
    data.slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  return db.brand.create({ data })
}

export async function getBrandById(id: number) {
  return db.brand.findUnique({ where: { id } })
}

export async function getBrandBySlug(slug: string) {
  return db.brand.findUnique({ where: { slug } })
}

export async function updateBrand(id: number, data: UpdateBrandInput) {
  return db.brand.update({ where: { id }, data })
}

export async function deleteBrand(id: number) {
  return db.brand.delete({ where: { id } })
}

export async function listBrands(
  params: BrandFilterParams = {}
): Promise<PaginatedResult<Prisma.BrandGetPayload<object>>> {
  const {
    page = 1,
    limit = 20,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    isActive,
    country,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.BrandWhereInput = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  if (isActive !== undefined) where.isActive = isActive
  if (country) where.country = country

  const [total, data] = await Promise.all([
    db.brand.count({ where }),
    db.brand.findMany({
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
