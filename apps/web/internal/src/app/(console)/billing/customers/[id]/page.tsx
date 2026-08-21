import type { Metadata } from 'next'
import { CustomerDetail } from '@/features/billing/components/customers/CustomerDetail'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Customer' }

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams
  return (
    <PermissionGate permission="billing.view">
      <CustomerDetail slug={id} from={from} />
    </PermissionGate>
  )
}
