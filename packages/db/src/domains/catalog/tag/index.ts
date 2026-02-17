import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { CreateTagInput, TagFilterParams, UpdateTagInput } from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createTag(data: CreateTagInput) {
  if (!data.slug && data.name) {
    data.slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  return db.tag.create({ data })
}

export async function getTagById(id: number) {
  return db.tag.findUnique({ where: { id } })
}

export async function updateTag(id: number, data: UpdateTagInput) {
  return db.tag.update({ where: { id }, data })
}

export async function deleteTag(id: number) {
  return db.tag.delete({ where: { id } })
}

export async function listTags(
  params: TagFilterParams = {}
): Promise<PaginatedResult<Prisma.TagGetPayload<object>>> {
  const {
    page = 1,
    limit = 50,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    type,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.TagWhereInput = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  if (type) where.type = type

  const [total, data] = await Promise.all([
    db.tag.count({ where }),
    db.tag.findMany({
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
