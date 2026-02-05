import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface WishlistFilterParams extends BaseFilterParams {
  userId?: number
  isPublic?: boolean
}

export type CreateWishlistInput = Prisma.WishlistCreateInput
export type UpdateWishlistInput = Prisma.WishlistUpdateInput
