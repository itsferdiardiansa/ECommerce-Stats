import { BaseFilterParams } from '@/types/filters'
import { Prisma } from '@prisma/generated'

export interface AuditLogFilterParams extends BaseFilterParams {
  userId?: number
  action?: string
  entity?: string
  entityId?: string
}

export type CreateAuditLogInput = Prisma.AuditLogCreateInput
