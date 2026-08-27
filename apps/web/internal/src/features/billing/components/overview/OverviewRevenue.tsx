'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Card, SegmentedTabs, TONE, cn } from '@rufieltics/ui'
import { formatCurrency, formatCurrencyCompact } from '@rufieltics/core'
import {
  REVENUE_MONTHS,
  REVENUE_SERIES,
} from '@/features/billing/data/overview'
import { GradientLine } from '@/features/billing/components/shared/GradientLine'

const ACTIVE_PROVIDERS = ['Stripe', 'Midtrans']
const USD_RATE = 16_000

type Currency = 'IDR' | 'USD'

const revenueTotals = REVENUE_MONTHS.map((_, index) =>
  REVENUE_SERIES.filter(series =>
    ACTIVE_PROVIDERS.includes(series.name)
  ).reduce((sum, series) => sum + (series.data[index] ?? 0), 0)
)

function RevenueSummary() {
  const [range, setRange] = useState('7d')

  return (
    <div className="col-span-3 flex flex-col gap-4">
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">Your revenue report</span>
          <span className="text-muted-foreground text-sm">
            Look at your revenue
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-5xl font-black tracking-tight">
              {formatCurrencyCompact(61_400_000, 'IDR')}
            </span>
            <span className="text-muted-foreground text-sm">
              + {formatCurrency(5240, 'USD')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold',
                TONE.success.text
              )}
            >
              <ArrowUpRight className="size-3.5" />
              8.2%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-end">
        <SegmentedTabs
          value={range}
          onChange={setRange}
          ariaLabel="Date range"
          variant="ghost"
          options={[
            { value: '7d', label: '7d' },
            { value: '30d', label: '30d' },
            { value: '6m', label: '6m' },
            { value: '1y', label: '1y' },
          ]}
        />
      </div>
    </div>
  )
}

function RevenueChart() {
  const [currency, setCurrency] = useState<Currency>('IDR')

  const data = useMemo(
    () =>
      currency === 'USD'
        ? revenueTotals.map(value => value / USD_RATE)
        : revenueTotals,
    [currency]
  )

  const format = (value: number) => formatCurrencyCompact(value, currency)

  return (
    <div className="col-span-9 flex flex-col gap-2">
      <div className="flex">
        <SegmentedTabs
          value={currency}
          onChange={value => setCurrency(value as Currency)}
          ariaLabel="Currency"
          options={[
            { value: 'IDR', label: 'IDR' },
            { value: 'USD', label: 'USD' },
          ]}
        />
      </div>
      <GradientLine
        categories={REVENUE_MONTHS}
        data={data}
        name="Revenue"
        formatValue={format}
        height={360}
      />
    </div>
  )
}

export function OverviewRevenue() {
  return (
    <Card bordered={false} className="h-full gap-4">
      <Card.Content className="grid grid-cols-12">
        <RevenueSummary />
        <RevenueChart />
      </Card.Content>
    </Card>
  )
}
