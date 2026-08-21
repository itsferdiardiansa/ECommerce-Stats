'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Download,
  Undo2,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Carousel,
  DataTable,
  SelectField,
  StatCard,
  TONE,
  cn,
  type DataTableColumn,
} from '@rufieltics/ui'
import {
  AreaLineChart,
  BarChart,
  DonutChart,
  Sparkline,
} from '@rufieltics/ui/charts'
import {
  formatCurrency,
  formatCurrencyCompact,
  slugify,
} from '@rufieltics/core-client'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import {
  KPI_SPARKS,
  METHOD_SPLIT,
  PLAN_BREAKDOWN,
  PROVIDER_SPLIT,
  RECENT_PAYMENTS,
  REVENUE_MONTHS,
  REVENUE_SERIES,
  type RecentPayment,
} from '@/features/billing/data/overview'
import {
  ATTENTION_CATEGORIES,
  ATTENTION_TONE,
  type AttentionCategory,
} from '@/features/billing/data/attention'
import { RENEWALS, type Renewal } from '@/features/billing/data/renewals'
import type { TxnRow } from '@/features/billing/data/transactions'
import { TransactionDetailDrawer } from '@/features/billing/components/transactions/TransactionDetailDrawer'
import { RenewalDrawer } from '@/features/billing/components/renewals/RenewalDrawer'
import { AttentionDrawer } from './AttentionDrawer'

const recentColumns: DataTableColumn<RecentPayment>[] = [
  {
    id: 'when',
    header: 'Time',
    cell: r => (
      <span className="text-muted-foreground font-mono text-xs">{r.when}</span>
    ),
  },
  {
    id: 'org',
    header: 'Organization',
    cell: r => <span className="font-medium">{r.org}</span>,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    cell: r => (
      <span className="font-medium tabular-nums">
        {r.amount}
        <span className="text-muted-foreground ml-1 text-[11px]">
          {r.currency}
        </span>
      </span>
    ),
  },
  {
    id: 'method',
    header: 'Method',
    cell: r => (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span
          className="size-2 rounded-full"
          style={{ background: r.methodColor }}
        />
        {r.method}
      </span>
    ),
  },
  {
    id: 'provider',
    header: 'Provider',
    cell: r => (
      <span className="text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs">
        {r.provider}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: r => <TxnStatusBadge tone={r.status}>{r.statusLabel}</TxnStatusBadge>,
  },
]

function toTxnRow(p: RecentPayment): TxnRow {
  return {
    id: `CH-${slugify(p.org).slice(0, 6)}-${p.when.replace(':', '')}`,
    date: `Today · ${p.when}`,
    org: p.org,
    email: `billing@${slugify(p.org).replace(/-/g, '')}.id`,
    amount: p.amount,
    currency: p.currency as TxnRow['currency'],
    method: p.method,
    methodColor: p.methodColor,
    provider: p.provider,
    status: p.status,
    statusLabel: p.statusLabel,
  }
}

export function BillingOverview() {
  const router = useRouter()
  const [attention, setAttention] = useState<AttentionCategory | null>(null)
  const [selectedTxn, setSelectedTxn] = useState<TxnRow | null>(null)
  const [renewal, setRenewal] = useState<Renewal | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-muted-foreground text-sm">
            Revenue, subscriptions and payment health across every provider.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SelectField
            className="w-40"
            value="30d"
            onChange={() => undefined}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '12m', label: 'Last 12 months' },
            ]}
          />
          <Button variant="outline">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <Carousel itemClassName="w-96" ariaLabel="Key billing metrics">
        <StatCard
          label="Net revenue (MRR)"
          value={formatCurrencyCompact(61_400_000, 'IDR')}
          sub={`+ ${formatCurrency(5240, 'USD')}`}
          delta={{ value: '8.2%', direction: 'up' }}
          hint="vs last month"
          icon={Wallet}
          aside={
            <div className="w-24">
              <Sparkline data={KPI_SPARKS.revenue} />
            </div>
          }
        />
        <StatCard
          label="Collected"
          value={formatCurrencyCompact(148_720_000, 'IDR')}
          delta={{ value: '12%', direction: 'up' }}
          hint="330 payments"
          icon={Banknote}
          aside={
            <div className="w-24">
              <Sparkline data={KPI_SPARKS.collected} />
            </div>
          }
        />
        <StatCard
          label="Active subs"
          value="248"
          delta={{ value: '15', direction: 'up' }}
          hint="31 trialing"
          icon={Users}
          aside={
            <div className="w-24">
              <Sparkline data={KPI_SPARKS.activeSubs} />
            </div>
          }
        />
        <StatCard
          label="Past due"
          value="9"
          delta={{ value: '3', direction: 'up', invert: true }}
          hint="in dunning"
          icon={AlertTriangle}
          aside={
            <div className="w-24">
              <Sparkline data={KPI_SPARKS.pastDue} />
            </div>
          }
        />
        <StatCard
          label="Refunds"
          value={formatCurrencyCompact(1_100_000, 'IDR')}
          delta={{ value: '2%', direction: 'down', invert: true }}
          hint="6 refunds"
          icon={Undo2}
          aside={
            <div className="w-24">
              <Sparkline data={KPI_SPARKS.refunds} />
            </div>
          }
        />
      </Carousel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Net revenue</CardTitle>
            <span className="text-muted-foreground text-xs">
              last 12 months
            </span>
          </CardHeader>
          <CardContent>
            <AreaLineChart
              categories={REVENUE_MONTHS}
              series={REVENUE_SERIES}
              height={240}
              showLegend
              valueFormatter={v => formatCurrencyCompact(v, 'IDR')}
              ariaLabel="Net revenue by settlement region over 12 months"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Revenue by provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={PROVIDER_SPLIT}
              height={240}
              centerValue={formatCurrencyCompact(148_720_000, 'IDR')}
              centerLabel="collected"
              valueFormatter={v => formatCurrency(v, 'IDR')}
              ariaLabel="Share of revenue by payment provider"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Subscriptions by plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              categories={PLAN_BREAKDOWN.categories}
              series={PLAN_BREAKDOWN.series}
              height={220}
              ariaLabel="Number of subscriptions per plan"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Payment methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={METHOD_SPLIT}
              height={220}
              ariaLabel="Payments by method"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Needs attention
            </CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground -my-1 text-xs"
                onClick={() => router.push('/billing/attention')}
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {ATTENTION_CATEGORIES.map(a => (
              <button
                key={a.label}
                type="button"
                onClick={() => setAttention(a)}
                className="hover:bg-accent/50 -mx-2 flex w-full cursor-pointer items-center justify-between rounded-md border-b px-2 py-2.5 text-left transition-colors last:border-0"
              >
                <div>
                  <div className="text-sm font-medium">{a.label}</div>
                  <div className="text-muted-foreground text-xs">
                    {a.detail}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-xl font-semibold tabular-nums',
                    TONE[ATTENTION_TONE[a.tone]].text
                  )}
                >
                  {a.count}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent payments
            </CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground -my-1 text-xs"
                onClick={() => router.push('/billing/transactions')}
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={recentColumns}
              data={RECENT_PAYMENTS}
              rowKey={(_, i) => String(i)}
              showSync={false}
              onRowClick={p => setSelectedTxn(toTxnRow(p))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Upcoming renewals
            </CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground -my-1 text-xs"
                onClick={() => router.push('/billing/renewals')}
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {RENEWALS.slice(0, 5).map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRenewal(r)}
                className="hover:bg-accent/50 -mx-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border-b px-2 py-2.5 text-left transition-colors last:border-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.org}</div>
                  <div className="text-muted-foreground text-xs">
                    {r.plan} · {r.provider}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium tabular-nums">
                    {r.amount}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {r.nextCharge}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}
