import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface ProductVariantFilterParams extends BaseFilterParams {
  productId?: number
  sku?: string
  isActive?: boolean
  lowStock?: boolean
}

export type CreateProductVariantInput = Prisma.ProductVariantCreateInput
export type UpdateProductVariantInput = Prisma.ProductVariantUpdateInput
