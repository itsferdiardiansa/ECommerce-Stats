import { parseCurrency } from '@rufieltics/core'
import type { TxnRow } from '@/features/billing/data/transactions'
import type { RefundTarget } from '@/features/billing/types/refund-types'
import { buildRefundTarget } from './refund-target'

export function txnToRefundTarget(row: TxnRow): RefundTarget {
  return buildRefundTarget({
    reference: row.id,
    customer: row.org,
    customerEmail: row.email,
    paidAmount: parseCurrency(row.amount, row.currency),
    currency: row.currency,
    method: {
      label: row.method,
      color: row.methodColor,
      account: '081288428842',
    },
  })
}
