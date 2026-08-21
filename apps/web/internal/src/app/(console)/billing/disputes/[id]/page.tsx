import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DisputeDetail } from '@/features/billing/components/disputes/DisputeDetail'
import { getDispute } from '@/features/billing/data/disputes'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Dispute' }

export default async function DisputePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dispute = getDispute(id)
  if (!dispute) notFound()

  return (
    <PermissionGate permission="billing.view">
      <DisputeDetail dispute={dispute} />
    </PermissionGate>
  )
}
