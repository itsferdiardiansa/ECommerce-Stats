import type { Metadata } from 'next'
import { AttentionOverview } from '@/features/billing/components/attention/AttentionOverview'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Needs attention' }

export default function AttentionPage() {
  return (
    <PermissionGate permission="billing.view">
      <AttentionOverview />
    </PermissionGate>
  )
}
