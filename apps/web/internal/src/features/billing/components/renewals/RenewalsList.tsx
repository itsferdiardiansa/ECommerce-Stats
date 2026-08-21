'use client'

import { useMemo, useState } from 'react'
import {
  Carousel,
  DataTable,
  Input,
  SelectField,
  StatCard,
  useDebouncedValue,
  usePagination,
} from '@rufieltics/ui'
import { renewalColumns } from '@/features/billing/configs/renewals'
import {
  RENEWALS,
  RENEWAL_TOTALS,
  type Renewal,
} from '@/features/billing/data/renewals'
import { RenewalDrawer } from './RenewalDrawer'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'paused', label: 'Auto-renew off' },
]

const WINDOW_OPTIONS = [
  { value: '30', label: 'Next 30 days' },
  { value: '7', label: 'Next 7 days' },
  { value: '3', label: 'Next 3 days' },
]

export function RenewalsList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [window, setWindow] = useState('30')
  const [selected, setSelected] = useState<Renewal | null>(null)
  const debounced = useDebouncedValue(search, 250)

  const rows = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    const days = Number(window)
    return RENEWALS.filter(
      r =>
        r.dueInDays <= days &&
        (status === 'ALL' || r.status === status) &&
        (!term ||
          `${r.org}${r.email}${r.id}${r.plan}`.toLowerCase().includes(term))
    )
  }, [debounced, status, window])

  const { pageItems, state } = usePagination(rows, 8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Upcoming renewals</h1>
        <p className="text-muted-foreground text-sm">
          Subscriptions billing soon, and which ones are at risk of failing.
        </p>
      </div>

      <Carousel itemClassName="w-64" ariaLabel="Renewal metrics">
        <StatCard
          label="Expected"
          value={RENEWAL_TOTALS.expected}
          hint="next 30 days"
        />
        <StatCard
          label="This week"
          value={String(RENEWAL_TOTALS.thisWeek)}
          hint="renewals due"
        />
        <StatCard
          label="At risk"
          value={String(RENEWAL_TOTALS.atRisk)}
          hint="expiring method"
        />
        <StatCard
          label="Auto-renew off"
          value={String(RENEWAL_TOTALS.autoRenewOff)}
          hint="will lapse"
        />
        <StatCard
          label="Total"
          value={String(RENEWALS.length)}
          hint="scheduled"
        />
      </Carousel>

      <DataTable
        variant="card"
        columns={renewalColumns}
        data={pageItems}
        rowKey={row => row.id}
        onRowClick={setSelected}
        pagination={state}
        emptyMessage="No renewals match these filters."
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search customer, plan or id…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <SelectField
              className="sm:w-40"
              value={window}
              onChange={setWindow}
              options={WINDOW_OPTIONS}
            />
            <SelectField
              className="sm:w-44"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
          </div>
        }
      />

      <RenewalDrawer renewal={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
