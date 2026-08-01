import { db } from '@/libs/prisma'
import { Prisma, Organization } from '@prisma/generated'
import { BaseFilterParams, PaginatedResult } from '@/types/filters'

export interface OrganizationFilterParams extends BaseFilterParams {
  name?: string
  slug?: string
}

export type CreateOrganizationInput = Prisma.OrganizationCreateInput
export type UpdateOrganizationInput = Prisma.OrganizationUpdateInput

export const Organizations = {
  async create(data: CreateOrganizationInput) {
    return db.organization.create({ data })
  },

  async findById(id: string) {
    return db.organization.findUnique({
      where: { id },
    })
  },

  async findBySlug(slug: string) {
    return db.organization.findUnique({
      where: { slug },
    })
  },

  async update(id: string, data: UpdateOrganizationInput) {
    return db.organization.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    return db.organization.delete({
      where: { id },
    })
  },

  async list(
    params: OrganizationFilterParams = {}
  ): Promise<PaginatedResult<Organization>> {
    const {
      page = 1,
      limit = 10,
      search,
      name,
      slug,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params

    const safePage = Math.max(1, page)
    const safeLimit = Math.max(1, Math.min(100, limit))
    const skip = (safePage - 1) * safeLimit

    const where: Prisma.OrganizationWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (name) where.name = { contains: name, mode: 'insensitive' }
    if (slug) where.slug = { contains: slug, mode: 'insensitive' }

    const [total, data] = await Promise.all([
      db.organization.count({ where }),
      db.organization.findMany({
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
  },
}
