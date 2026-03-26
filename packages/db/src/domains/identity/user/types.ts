import { BaseFilterParams } from '@/types/filters'
import { Prisma, TierLevel } from '@prisma/generated'

export interface UserFilterParams extends BaseFilterParams {
  email?: string
  name?: string
  isActive?: boolean
  isStaff?: boolean
  isTwoFactorEnabled?: boolean
  marketingOptIn?: boolean
  tierLevel?: TierLevel
  includeDeleted?: boolean
}

export type CreateUserInput = Prisma.UserCreateInput
export type UpdateUserInput = Prisma.UserUpdateInput

export interface UserAddressFilterParams extends BaseFilterParams {
  userId?: number
  type?: string
  isDefault?: boolean
  country?: string
}

export type CreateUserAddressInput = Prisma.UserAddressCreateInput
export type UpdateUserAddressInput = Prisma.UserAddressUpdateInput
