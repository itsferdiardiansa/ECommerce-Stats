import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  CategoryFilterParams,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createCategory(data: CreateCategoryInput) {
  if (!data.slug && data.name) {
    data.slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  return db.category.create({ data })
}

export async function getCategoryById(id: number) {
  return db.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
    },
  })
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
    },
  })
}

export async function updateCategory(id: number, data: UpdateCategoryInput) {
  return db.category.update({ where: { id }, data })
}

export async function deleteCategory(id: number) {
  return db.category.delete({ where: { id } })
}

export async function listCategories(
  params: CategoryFilterParams = {}
): Promise<
  PaginatedResult<Prisma.CategoryGetPayload<{ include: { children: true } }>>
> {
  const {
    page = 1,
    limit = 20,
    search,
    sortBy = 'displayOrder',
    sortOrder = 'asc',
    parentId,
    isActive,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.CategoryWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (isActive !== undefined) where.isActive = isActive

  if (parentId !== undefined) {
    where.parentId = parentId
  }

  const [total, data] = await Promise.all([
    db.category.count({ where }),
    db.category.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: { children: true },
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
