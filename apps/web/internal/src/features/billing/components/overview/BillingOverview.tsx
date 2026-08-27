'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@rufieltics/core'
import { DashboardContentShell, Divider, SectionShell } from '@rufieltics/ui'
import type { AttentionCategory } from '@/features/billing/data/attention'
import type { Renewal } from '@/features/billing/data/renewals'
import type { TxnRow } from '@/features/billing/data/transactions'
import { TransactionDetailDrawer } from '@/features/billing/components/transactions/TransactionDetailDrawer'
import { RenewalDrawer } from '@/features/billing/components/renewals/RenewalDrawer'
import { AttentionDrawer } from './AttentionDrawer'
import { OverviewActionAlert } from './OverviewActionAlert'
import { OverviewKpis } from './OverviewKpis'
import { OverviewRevenue } from './OverviewRevenue'
import { OverviewActivityCard } from './OverviewActivityCard'
import { OverviewAttentionCard } from './OverviewAttentionCard'

export function BillingOverview() {
  const router = useRouter()
  const [attention, setAttention] = useState<AttentionCategory | null>(null)
  const [selectedTxn, setSelectedTxn] = useState<TxnRow | null>(null)
  const [renewal, setRenewal] = useState<Renewal | null>(null)

  return (
    <DashboardContentShell
      title="Billing Overview"
      subTitle="Your billing summary and recent activity."
      alert={<OverviewActionAlert />}
    >
      <SectionShell>
        <OverviewKpis />
        <Divider />
        <OverviewRevenue />
      </SectionShell>

      <SectionShell>
        <div className="grid items-start gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <OverviewActivityCard
              onSelect={setSelectedTxn}
              onSelectRenewal={setRenewal}
            />
          </div>
          <div className="lg:col-span-4">
            <OverviewAttentionCard onSelect={setAttention} />
          </div>
        </div>
      </SectionShell>

      <AttentionDrawer
        category={attention}
        onClose={() => setAttention(null)}
      />
      <RenewalDrawer
        renewal={renewal}
        from="overview"
        onClose={() => setRenewal(null)}
      />
      <TransactionDetailDrawer
        row={selectedTxn}
        variant="all"
        onClose={() => setSelectedTxn(null)}
        onViewCustomer={r => {
          setSelectedTxn(null)
          router.push(`/billing/customers/${slugify(r.org)}?from=overview`)
        }}
      />
    </DashboardContentShell>
  )
}
