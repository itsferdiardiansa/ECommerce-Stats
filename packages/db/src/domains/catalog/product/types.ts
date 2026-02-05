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
