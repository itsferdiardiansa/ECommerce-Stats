import { BaseFilterParams } from '@/types/filters'
import { Prisma, OrderStatus } from '@prisma/generated'

export interface OrderFilterParams extends BaseFilterParams {
  status?: OrderStatus
  userId?: number
  fromDate?: Date | string
  toDate?: Date | string
  minTotal?: number
  maxTotal?: number
}

export type CreateOrderInput = Prisma.OrderCreateInput
export type UpdateOrderInput = Prisma.OrderUpdateInput
