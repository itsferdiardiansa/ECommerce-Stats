import type { Metadata } from 'next'
import { PaymentProvidersPage } from '@/features/billing/components/providers/PaymentProvidersPage'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Payment providers' }

export default function ProvidersPage() {
  return (
    <PermissionGate permission="payments.manage">
      <PaymentProvidersPage />
    </PermissionGate>
  )
}
