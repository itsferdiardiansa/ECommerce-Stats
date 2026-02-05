import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface UserFilterParams extends BaseFilterParams {
  email?: string
  name?: string
  isActive?: boolean
  marketingOptIn?: boolean
  tierLevel?: string
}

export type CreateUserInput = Prisma.UserCreateInput
export type UpdateUserInput = Prisma.UserUpdateInput
