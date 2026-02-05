import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface PriceHistoryFilterParams extends BaseFilterParams {
  productId?: number
  reason?: string
}

export type CreatePriceHistoryInput = Prisma.PriceHistoryCreateInput
