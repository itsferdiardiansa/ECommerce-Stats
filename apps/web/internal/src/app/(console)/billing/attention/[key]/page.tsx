import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AttentionCategoryDetail } from '@/features/billing/components/attention/AttentionCategoryDetail'
import { getAttentionCategory } from '@/features/billing/data/attention'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Needs attention' }

export default async function AttentionCategoryPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  const category = getAttentionCategory(key)
  if (!category) notFound()

  return (
    <PermissionGate permission="billing.view">
      <AttentionCategoryDetail category={category} />
    </PermissionGate>
  )
}
