import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface ProductFilterParams extends BaseFilterParams {
  minPrice?: number
  maxPrice?: number
  categoryId?: number
  brandId?: number
  isActive?: boolean
  inStock?: boolean
}

export type CreateProductInput = Prisma.ProductCreateInput
export type UpdateProductInput = Prisma.ProductUpdateInput

export interface ProductVariantFilterParams extends BaseFilterParams {
  productId?: number
  sku?: string
  isActive?: boolean
  lowStock?: boolean
}

export type CreateProductVariantInput = Prisma.ProductVariantCreateInput
export type UpdateProductVariantInput = Prisma.ProductVariantUpdateInput
