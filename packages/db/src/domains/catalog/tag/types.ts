import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface TagFilterParams extends BaseFilterParams {
  type?: string
}

export type CreateTagInput = Prisma.TagCreateInput
export type UpdateTagInput = Prisma.TagUpdateInput
