import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface PaymentFilterParams extends BaseFilterParams {
  orderId?: number
  provider?: string
  status?: string
}

export type CreatePaymentInput = Prisma.PaymentCreateInput
export type UpdatePaymentInput = Prisma.PaymentUpdateInput
