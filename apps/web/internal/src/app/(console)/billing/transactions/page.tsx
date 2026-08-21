import type { Metadata } from 'next'
import { TransactionsView } from '@/features/billing/components/transactions/TransactionsView'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'All charges' }

export default function AllChargesPage() {
  return (
    <PermissionGate permission="payments.manage">
      <TransactionsView variant="all" />
    </PermissionGate>
  )
}
