import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  ReviewFilterParams,
  CreateReviewInput,
  UpdateReviewInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createReview(data: CreateReviewInput) {
  return db.productReview.create({ data })
}

export async function getReviewById(id: number) {
  return db.productReview.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

export async function updateReview(id: number, data: UpdateReviewInput) {
  return db.productReview.update({ where: { id }, data })
}

export async function deleteReview(id: number) {
  return db.productReview.delete({ where: { id } })
}

export async function listReviews(
  params: ReviewFilterParams = {}
): Promise<
  PaginatedResult<Prisma.ProductReviewGetPayload<{ include: { user: true } }>>
> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minRating,
    isPublished,
    productId,
    userId,
    search,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.ProductReviewWhereInput = {}

  if (minRating) where.rating = { gte: minRating }
  if (isPublished !== undefined) where.isPublished = isPublished
  if (productId) where.productId = productId
  if (userId) where.userId = userId

  if (search) {
    where.OR = [
      { comment: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, data] = await Promise.all([
    db.productReview.count({ where }),
    db.productReview.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
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
    Prisma.ProductReviewGetPayload<{ include: { user: true } }>
  >
}
