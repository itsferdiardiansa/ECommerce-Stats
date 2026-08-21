import type { Metadata } from 'next'
import { TransactionsView } from '@/features/billing/components/transactions/TransactionsView'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Refunds' }

export default function RefundsPage() {
  return (
    <PermissionGate permission="payments.manage">
      <TransactionsView variant="refunds" />
    </PermissionGate>
  )
}
