'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Download } from 'lucide-react'
import {
  Button,
  DashboardContentShell,
  DataTable,
  Divider,
  Input,
  SectionShell,
  SelectField,
  StatList,
  useDebouncedValue,
  usePagination,
  type StatListItem,
} from '@rufieltics/ui'
import { Sparkline } from '@rufieltics/ui/charts'
import { formatCurrencyCompact, slugify } from '@rufieltics/core'
import { transactionColumns } from '@/features/billing/configs/transactions'
import {
  CHARGES,
  CHARGE_VOLUME,
  FAILED,
  REFUNDS,
  TXN_KPIS,
  type TxnRow,
  type TxnVariant,
} from '@/features/billing/data/transactions'
import { TrendChartCard } from '@/features/billing/components/shared/TrendChartCard'
import { TransactionDetailDrawer } from './TransactionDetailDrawer'

const CHARGE_TABS = [
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
]

const META: Record<
  TxnVariant,
  { title: string; subtitle: string; data: TxnRow[] }
> = {
  all: {
    title: 'All charges',
    subtitle: 'Every capture attempt across all tenants and providers.',
    data: CHARGES,
  },
  refunds: {
    title: 'Refunds',
    subtitle: 'Full and partial refunds, with the reason recorded.',
    data: REFUNDS,
  },
  failed: {
    title: 'Failed & retries',
    subtitle: 'Declined and expired charges, and what recovered on retry.',
    data: FAILED,
  },
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
]

const PROVIDER_OPTIONS = [
  { value: 'ALL', label: 'All providers' },
  { value: 'Stripe', label: 'Stripe' },
  { value: 'Xendit', label: 'Xendit' },
  { value: 'Midtrans', label: 'Midtrans' },
]

export function TransactionsView({ variant }: { variant: TxnVariant }) {
  const router = useRouter()
  const meta = META[variant]
  const columns = useMemo(() => transactionColumns(variant), [variant])
  const [search, setSearch] = useState('')
  const [provider, setProvider] = useState('ALL')
  const debounced = useDebouncedValue(search, 250)

  const [selected, setSelected] = useState<TxnRow | null>(null)
  const [chargeRange, setChargeRange] = useState('14d')

  const kpiItems = useMemo<StatListItem[]>(
    () =>
      TXN_KPIS[variant].map(item => ({
        label: item.label,
        value: item.value,
        sub: item.sub,
        delta: item.delta,
        hint: item.hint,
        icon: item.icon,
        aside: item.spark ? (
          <div className="w-20">
            <Sparkline data={item.spark} />
          </div>
        ) : undefined,
      })),
    [variant]
  )

  const chargeDays = chargeRange === '7d' ? 7 : 14
  const chargeCategories = CHARGE_VOLUME.days.slice(-chargeDays)
  const chargeData = CHARGE_VOLUME.series[0].data.slice(-chargeDays)

  const rows = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return meta.data.filter(
      item =>
        (provider === 'ALL' || item.provider === provider) &&
        (!term ||
          `${item.org}${item.email}${item.id}${item.method}`
            .toLowerCase()
            .includes(term))
    )
  }, [meta.data, debounced, provider])

  const { pageItems, state } = usePagination(rows, 8)

  return (
    <DashboardContentShell
      title={meta.title}
      subTitle={meta.subtitle}
      actions={
        <Button variant="outline">
          <Download className="size-4" />
          Export
        </Button>
      }
    >
      <SectionShell>
        <StatList
          layout="carousel"
          items={kpiItems}
          itemClassName="w-80"
          ariaLabel="Transaction metrics"
        />

        {variant === 'all' ? (
          <>
            <Divider />
            <TrendChartCard
              title="Charge volume"
              icon={Activity}
              categories={chargeCategories}
              data={chargeData}
              name="Volume"
              formatValue={value => formatCurrencyCompact(value, 'IDR')}
              height={220}
              tabs={CHARGE_TABS}
              tabValue={chargeRange}
              onTabChange={setChargeRange}
            />
          </>
        ) : null}
      </SectionShell>

      <SectionShell>
        <DataTable
          variant="card"
          columns={columns}
          data={pageItems}
          rowKey={row => row.id}
          onRowClick={setSelected}
          pagination={state}
          emptyMessage="No transactions match these filters."
          toolbar={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search org, email or txn id…"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="sm:max-w-xs"
              />
              <SelectField
                className="sm:w-44"
                value={provider}
                onChange={setProvider}
                options={PROVIDER_OPTIONS}
              />
              <SelectField
                className="sm:w-44"
                value="ALL"
                onChange={() => undefined}
                options={STATUS_OPTIONS}
              />
            </div>
          }
        />
      </SectionShell>

      <TransactionDetailDrawer
        row={selected}
        variant={variant}
        onClose={() => setSelected(null)}
        onViewCustomer={r => {
          setSelected(null)
          const from = variant === 'all' ? 'transactions' : variant
          router.push(`/billing/customers/${slugify(r.org)}?from=${from}`)
        }}
      />
    </DashboardContentShell>
  )
}
