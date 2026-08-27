'use client'

import { AlertTriangle, Banknote, Undo2, Users } from 'lucide-react'
import { StatList, type StatListItem } from '@rufieltics/ui'
import { Sparkline } from '@rufieltics/ui/charts'
import { formatCurrencyCompact } from '@rufieltics/core'
import { KPI_SPARKS } from '@/features/billing/data/overview'

const KPIS: StatListItem[] = [
  {
    label: 'Collected',
    info: 'Net payments captured this month, after refunds and provider fees.',
    value: formatCurrencyCompact(148_720_000, 'IDR'),
    delta: { value: '12%', direction: 'up' },
    hint: '330 payments',
    icon: Banknote,
    iconTone: 'success',
    aside: (
      <div className="w-24">
        <Sparkline data={KPI_SPARKS.collected} />
      </div>
    ),
  },
  {
    label: 'Active subs',
    value: '248',
    delta: { value: '15', direction: 'up' },
    hint: '31 trialing',
    icon: Users,
    iconTone: 'info',
    aside: (
      <div className="w-24">
        <Sparkline data={KPI_SPARKS.activeSubs} />
      </div>
    ),
  },
  {
    label: 'Past due',
    value: '9',
    delta: { value: '3', direction: 'up', invert: true },
    hint: 'in dunning',
    icon: AlertTriangle,
    iconTone: 'warning',
    aside: (
      <div className="w-24">
        <Sparkline data={KPI_SPARKS.pastDue} />
      </div>
    ),
  },
  {
    label: 'Refunds',
    value: formatCurrencyCompact(1_100_000, 'IDR'),
    delta: { value: '2%', direction: 'down', invert: true },
    hint: '6 refunds',
    icon: Undo2,
    iconTone: 'destructive',
    aside: (
      <div className="w-24">
        <Sparkline data={KPI_SPARKS.refunds} />
      </div>
    ),
  },
]

export function OverviewKpis() {
  return (
    <StatList items={KPIS} className="gap-6" cardClassName="bg-transparent" />
  )
}
