'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      dispute =>
        (status === 'ALL' || dispute.status === status) &&
        (!term ||
          `${dispute.org}${dispute.email}${dispute.id}${dispute.chargeId}`
            .toLowerCase()
            .includes(term))
    )
  }, [debounced, status])

  const { pageItems, state } = usePagination(rows, 8)

  const open = DISPUTES.filter(dispute => dispute.status === 'needs_response')
  const won = DISPUTES.filter(dispute => dispute.status === 'won').length
  const decided = DISPUTES.filter(
    dispute => dispute.status === 'won' || dispute.status === 'lost'
  ).length
  const winRate = decided ? Math.round((won / decided) * 100) : 0
  const dueSoon = open.filter(item => item.dueInDays <= 3).length

  return (
    <DashboardContentShell
      title="Disputes"
      subTitle="Chargebacks that need evidence before the network deadline."
    >
      <SectionShell>
        <StatList
          layout="carousel"
          itemClassName="w-64"
          ariaLabel="Dispute metrics"
          items={[
            {
              label: 'Needs response',
              value: String(open.length),
              hint: 'awaiting evidence',
            },
            {
              label: 'Due within 3 days',
              value: String(dueSoon),
              hint: 'act first',
            },
            {
              label: 'Under review',
              value: String(
                DISPUTES.filter(dispute => dispute.status === 'under_review')
                  .length
              ),
              hint: 'submitted',
            },
            { label: 'Win rate', value: `${winRate}%`, hint: 'last 90 days' },
            {
              label: 'Total open',
              value: String(DISPUTES.length),
              hint: 'all statuses',
            },
          ]}
        />
      </SectionShell>

      <SectionShell>
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
                onChange={event => setSearch(event.target.value)}
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
      </SectionShell>
    </DashboardContentShell>
  )
}
