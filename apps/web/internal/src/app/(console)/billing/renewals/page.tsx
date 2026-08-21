import type { Metadata } from 'next'
import { RenewalsList } from '@/features/billing/components/renewals/RenewalsList'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Upcoming renewals' }

export default function RenewalsPage() {
  return (
    <PermissionGate permission="billing.view">
      <RenewalsList />
    </PermissionGate>
  )
}
