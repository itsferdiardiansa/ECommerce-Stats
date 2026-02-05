import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface BrandFilterParams extends BaseFilterParams {
  isActive?: boolean
  country?: string
}

export type CreateBrandInput = Prisma.BrandCreateInput
export type UpdateBrandInput = Prisma.BrandUpdateInput
