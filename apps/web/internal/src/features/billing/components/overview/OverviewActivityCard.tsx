'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Receipt, RefreshCw } from 'lucide-react'
import {
  Button,
  Card,
  DataTable,
  SegmentedTabs,
  Tabs,
  cn,
} from '@rufieltics/ui'
import { RECENT_PAYMENTS } from '@/features/billing/data/overview'
import { RENEWALS, RENEWAL_TOTALS } from '@/features/billing/data/renewals'
import type { Renewal } from '@/features/billing/data/renewals'
import type { TxnRow } from '@/features/billing/data/transactions'
import {
  paymentColumns,
  renewalColumns,
} from '@/features/billing/configs/overview-activity'
import {
  RANGE_DAYS,
  groupRenewals,
  paymentToTxnRow,
  type ActivityRange,
  type RenewalRow,
  type RenewalTab,
} from '@/features/billing/lib/overview-activity'

function ViewAll({ href }: { href: string }) {
  const router = useRouter()
  return (
    <div className="mt-auto flex justify-center pt-3">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground text-xs"
        onClick={() => router.push(href)}
      >
        View all
        <ArrowUpRight className="size-3.5" />
      </Button>
    </div>
  )
}

function RecentPaymentsPanel({
  onSelect,
}: {
  onSelect: (row: TxnRow) => void
}) {
  const [range, setRange] = useState<ActivityRange>('7d')
  const [syncing, setSyncing] = useState(false)

  const rows = useMemo(
    () =>
      RECENT_PAYMENTS.filter(payment => payment.daysAgo < RANGE_DAYS[range]),
    [range]
  )

  const resync = () => {
    setSyncing(true)
    window.setTimeout(() => setSyncing(false), 900)
  }

  const toolbar = (
    <div className="flex items-center justify-between gap-3">
      <SegmentedTabs
        value={range}
        onChange={setRange}
        ariaLabel="Date range"
        options={[
          { value: '1d', label: '1d' },
          { value: '3d', label: '3d' },
          { value: '7d', label: '7d' },
        ]}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={resync}
        disabled={syncing}
      >
        <RefreshCw className={cn('size-3.5', syncing && 'animate-spin')} />
        Resync
      </Button>
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <DataTable
        columns={paymentColumns}
        data={rows}
        rowKey={(_, index) => String(index)}
        showSync={false}
        toolbar={toolbar}
        onRowClick={payment => onSelect(paymentToTxnRow(payment))}
        rowClassName={payment =>
          payment.status === 'bad' ? 'opacity-55' : undefined
        }
      />
      <ViewAll href="/billing/transactions" />
    </div>
  )
}

function RenewalsPanel({ onSelect }: { onSelect: (renewal: Renewal) => void }) {
  const [tab, setTab] = useState<RenewalTab>('scheduled')

  const rows = useMemo<RenewalRow[]>(() => groupRenewals(RENEWALS, tab), [tab])

  const toolbar = (
    <div className="flex items-center justify-between gap-3">
      <SegmentedTabs
        value={tab}
        onChange={setTab}
        ariaLabel="Renewal status"
        options={[
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'at-risk', label: 'At risk' },
          { value: 'auto-renew', label: 'Auto renew' },
        ]}
      />
      <span className="text-muted-foreground text-xs tabular-nums">
        {RENEWAL_TOTALS.thisWeek} this week
      </span>
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <DataTable
        columns={renewalColumns}
        data={rows}
        rowKey={row =>
          row.type === 'group' ? `g-${row.label}` : row.renewal.id
        }
        showSync={false}
        toolbar={toolbar}
        onRowClick={row => {
          if (row.type === 'renewal') onSelect(row.renewal)
        }}
        rowClassName={row => (row.type === 'group' ? 'bg-muted/40' : undefined)}
        emptyMessage="No renewals in this view."
      />
      <ViewAll href="/billing/renewals" />
    </div>
  )
}

export function OverviewActivityCard({
  onSelect,
  onSelectRenewal,
}: {
  onSelect: (row: TxnRow) => void
  onSelectRenewal: (renewal: Renewal) => void
}) {
  return (
    <Tabs defaultValue="recent" className="h-full">
      <Card bordered={false} className="h-full gap-3">
        <Card.Header
          title="Recent payments"
          icon={Receipt}
          className="border-b"
          action={
            <div className="flex justify-end">
              <Tabs.List
                ariaLabel="View"
                options={[
                  { value: 'recent', label: 'Recent Payment' },
                  { value: 'renewals', label: 'Upcoming Renewals' },
                ]}
              />
            </div>
          }
        />

        <Card.Content className="flex h-full flex-col">
          <Tabs.Panel value="recent" className="flex h-full flex-col">
            <RecentPaymentsPanel onSelect={onSelect} />
          </Tabs.Panel>
          <Tabs.Panel value="renewals" className="flex h-full flex-col">
            <RenewalsPanel onSelect={onSelectRenewal} />
          </Tabs.Panel>
        </Card.Content>
      </Card>
    </Tabs>
  )
}
