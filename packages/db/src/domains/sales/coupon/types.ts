import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface CouponFilterParams extends BaseFilterParams {
  code?: string
  isActive?: boolean
  discountType?: string
}

export type CreateCouponInput = Prisma.CouponCreateInput
export type UpdateCouponInput = Prisma.CouponUpdateInput
