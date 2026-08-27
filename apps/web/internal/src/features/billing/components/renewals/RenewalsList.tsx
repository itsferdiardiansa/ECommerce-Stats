'use client'

import { useMemo, useState } from 'react'
import {
  DashboardContentShell,
  DataTable,
  Input,
  SectionShell,
  SelectField,
  StatList,
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
      renewal =>
        renewal.dueInDays <= days &&
        (status === 'ALL' || renewal.status === status) &&
        (!term ||
          `${renewal.org}${renewal.email}${renewal.id}${renewal.plan}`
            .toLowerCase()
            .includes(term))
    )
  }, [debounced, status, window])

  const { pageItems, state } = usePagination(rows, 8)

  return (
    <DashboardContentShell
      title="Upcoming renewals"
      subTitle="Subscriptions billing soon, and which ones are at risk of failing."
    >
      <SectionShell>
        <StatList
          layout="carousel"
          itemClassName="w-64"
          ariaLabel="Renewal metrics"
          items={[
            {
              label: 'Expected',
              value: RENEWAL_TOTALS.expected,
              hint: 'next 30 days',
            },
            {
              label: 'This week',
              value: String(RENEWAL_TOTALS.thisWeek),
              hint: 'renewals due',
            },
            {
              label: 'At risk',
              value: String(RENEWAL_TOTALS.atRisk),
              hint: 'expiring method',
            },
            {
              label: 'Auto-renew off',
              value: String(RENEWAL_TOTALS.autoRenewOff),
              hint: 'will lapse',
            },
            {
              label: 'Total',
              value: String(RENEWALS.length),
              hint: 'scheduled',
            },
          ]}
        />
      </SectionShell>

      <SectionShell>
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
                onChange={event => setSearch(event.target.value)}
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
      </SectionShell>

      <RenewalDrawer renewal={selected} onClose={() => setSelected(null)} />
    </DashboardContentShell>
  )
}
