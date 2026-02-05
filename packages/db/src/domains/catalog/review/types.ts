import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface ReviewFilterParams extends BaseFilterParams {
  productId?: number
  userId?: number
  minRating?: number
  isPublished?: boolean
  isVerified?: boolean
}

export type CreateReviewInput = Prisma.ProductReviewCreateInput
export type UpdateReviewInput = Prisma.ProductReviewUpdateInput
