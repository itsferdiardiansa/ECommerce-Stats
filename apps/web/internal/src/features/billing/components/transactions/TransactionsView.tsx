'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Carousel,
  DataTable,
  Input,
  SelectField,
  StatCard,
  useDebouncedValue,
  usePagination,
} from '@rufieltics/ui'
import { AreaLineChart, Sparkline } from '@rufieltics/ui/charts'
import { formatCurrencyCompact, slugify } from '@rufieltics/core-client'
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
import { TransactionDetailDrawer } from './TransactionDetailDrawer'

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

  const rows = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return meta.data.filter(
      r =>
        (provider === 'ALL' || r.provider === provider) &&
        (!term ||
          `${r.org}${r.email}${r.id}${r.method}`.toLowerCase().includes(term))
    )
  }, [meta.data, debounced, provider])

  const { pageItems, state } = usePagination(rows, 8)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <h1 className="text-xl font-semibold">{meta.title}</h1>
          <p className="text-muted-foreground text-sm">{meta.subtitle}</p>
        </div>
        <Button variant="outline" className="ml-auto">
          <Download className="size-4" />
          Export
        </Button>
      </div>

      <Carousel itemClassName="w-80" ariaLabel="Transaction metrics">
        {TXN_KPIS[variant].map(k => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            sub={k.sub}
            delta={k.delta}
            hint={k.hint}
            icon={k.icon}
            aside={
              k.spark ? (
                <div className="w-20">
                  <Sparkline data={k.spark} />
                </div>
              ) : undefined
            }
          />
        ))}
      </Carousel>

      {variant === 'all' ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Charge volume</CardTitle>
            <span className="text-muted-foreground text-xs">last 14 days</span>
          </CardHeader>
          <CardContent>
            <AreaLineChart
              categories={CHARGE_VOLUME.days}
              series={CHARGE_VOLUME.series}
              height={200}
              valueFormatter={v => formatCurrencyCompact(v, 'IDR')}
              ariaLabel="Daily charge volume over the last 14 days"
            />
          </CardContent>
        </Card>
      ) : null}

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
              onChange={e => setSearch(e.target.value)}
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
    </div>
  )
}
