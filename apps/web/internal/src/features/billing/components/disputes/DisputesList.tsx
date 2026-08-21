'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Carousel,
  DataTable,
  Input,
  SelectField,
  StatCard,
  useDebouncedValue,
  usePagination,
} from '@rufieltics/ui'
import { disputeColumns } from '@/features/billing/configs/disputes'
import { DISPUTES } from '@/features/billing/data/disputes'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'needs_response', label: 'Needs response' },
  { value: 'under_review', label: 'Under review' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

export function DisputesList() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const debounced = useDebouncedValue(search, 250)

  const rows = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return DISPUTES.filter(
      d =>
        (status === 'ALL' || d.status === status) &&
        (!term ||
          `${d.org}${d.email}${d.id}${d.chargeId}`.toLowerCase().includes(term))
    )
  }, [debounced, status])

  const { pageItems, state } = usePagination(rows, 8)

  const open = DISPUTES.filter(d => d.status === 'needs_response')
  const won = DISPUTES.filter(d => d.status === 'won').length
  const decided = DISPUTES.filter(
    d => d.status === 'won' || d.status === 'lost'
  ).length
  const winRate = decided ? Math.round((won / decided) * 100) : 0
  const dueSoon = open.filter(d => d.dueInDays <= 3).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Disputes</h1>
        <p className="text-muted-foreground text-sm">
          Chargebacks that need evidence before the network deadline.
        </p>
      </div>

      <Carousel itemClassName="w-64" ariaLabel="Dispute metrics">
        <StatCard
          label="Needs response"
          value={String(open.length)}
          hint="awaiting evidence"
        />
        <StatCard
          label="Due within 3 days"
          value={String(dueSoon)}
          hint="act first"
        />
        <StatCard
          label="Under review"
          value={String(
            DISPUTES.filter(d => d.status === 'under_review').length
          )}
          hint="submitted"
        />
        <StatCard label="Win rate" value={`${winRate}%`} hint="last 90 days" />
        <StatCard
          label="Total open"
          value={String(DISPUTES.length)}
          hint="all statuses"
        />
      </Carousel>

      <DataTable
        variant="card"
        columns={disputeColumns}
        data={pageItems}
        rowKey={row => row.id}
        onRowClick={d => router.push(`/billing/disputes/${d.id}`)}
        pagination={state}
        emptyMessage="No disputes match these filters."
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search customer, dispute or charge id…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <SelectField
              className="sm:w-48"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
          </div>
        }
      />
    </div>
  )
}
