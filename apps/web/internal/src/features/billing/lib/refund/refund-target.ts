import type { RefundTarget } from '@/features/billing/types/refund-types'

export interface RefundTargetInput {
  reference: string
  customer: string
  customerEmail: string
  paidAmount: number
  currency: string
  method: { label: string; color: string; account?: string }
}

export function buildRefundTarget(input: RefundTargetInput): RefundTarget {
  return {
    reference: input.reference,
    customer: input.customer,
    customerEmail: input.customerEmail,
    paidAmount: input.paidAmount,
    currency: input.currency,
    method: input.method,
    plan: { name: 'Growth', price: 'Rp 299.000', interval: 'mo' },
    balance: 12_500_000,
  }
}
