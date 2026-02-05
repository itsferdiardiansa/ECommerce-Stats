import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface InventoryLogFilterParams extends BaseFilterParams {
  productId?: number
  reason?: string
  userId?: number
}

export type CreateInventoryLogInput = Prisma.InventoryLogCreateInput
