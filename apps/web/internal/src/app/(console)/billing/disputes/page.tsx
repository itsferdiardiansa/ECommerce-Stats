import type { Metadata } from 'next'
import { DisputesList } from '@/features/billing/components/disputes/DisputesList'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Disputes' }

export default function DisputesPage() {
  return (
    <PermissionGate permission="billing.view">
      <DisputesList />
    </PermissionGate>
  )
}
