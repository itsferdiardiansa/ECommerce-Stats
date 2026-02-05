import { BaseFilterParams } from '@/types/filters'
import {
  Prisma,
  BillingPeriod,
  SubscriptionStatus,
  InvoiceStatus,
} from '@prisma/generated'

export interface PlanFilterParams extends BaseFilterParams {
  isActive?: boolean
  interval?: BillingPeriod
}
export type CreatePlanInput = Prisma.PlanCreateInput
export type UpdatePlanInput = Prisma.PlanUpdateInput

export interface SubscriptionFilterParams extends BaseFilterParams {
  organizationId?: string
  planId?: string
  status?: SubscriptionStatus
}
export type CreateSubscriptionInput = Prisma.SubscriptionCreateInput
export type UpdateSubscriptionInput = Prisma.SubscriptionUpdateInput

export interface InvoiceFilterParams extends BaseFilterParams {
  organizationId?: string
  subscriptionId?: string
  status?: InvoiceStatus
}
export type CreateInvoiceInput = Prisma.InvoiceCreateInput
export type UpdateInvoiceInput = Prisma.InvoiceUpdateInput
