import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface CategoryFilterParams extends BaseFilterParams {
  parentId?: number | null
  isActive?: boolean
}

export type CreateCategoryInput = Prisma.CategoryCreateInput
export type UpdateCategoryInput = Prisma.CategoryUpdateInput
