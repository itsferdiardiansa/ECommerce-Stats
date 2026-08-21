import type { Metadata } from 'next'
import { BillingOverview } from '@/features/billing/components/overview/BillingOverview'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Payments & Billing' }

export default function BillingOverviewPage() {
  return (
    <PermissionGate permission="billing.view">
      <BillingOverview />
    </PermissionGate>
  )
}
