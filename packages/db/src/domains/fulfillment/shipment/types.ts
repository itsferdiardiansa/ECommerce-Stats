import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface ShipmentFilterParams extends BaseFilterParams {
  orderId?: number
  status?: string
  trackingNumber?: string
}

export type CreateShipmentInput = Prisma.ShipmentCreateInput
export type UpdateShipmentInput = Prisma.ShipmentUpdateInput
