import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface CartFilterParams extends BaseFilterParams {
  userId?: number
  sessionId?: string
  status?: string
}

export type CreateCartInput = Prisma.CartCreateInput
export type UpdateCartInput = Prisma.CartUpdateInput
