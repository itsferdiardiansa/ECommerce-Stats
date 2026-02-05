import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface UserAddressFilterParams extends BaseFilterParams {
  userId?: number
  type?: string
  isDefault?: boolean
  country?: string
}

export type CreateUserAddressInput = Prisma.UserAddressCreateInput
export type UpdateUserAddressInput = Prisma.UserAddressUpdateInput
