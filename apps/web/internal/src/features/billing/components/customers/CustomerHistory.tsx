'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import {
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  SelectField,
  useDebouncedValue,
  usePagination,
  type SelectFieldOption,
} from '@rufieltics/ui'
import { historyColumns } from '@/features/billing/configs/customer-history'
import { downloadJSON, downloadXLS } from '@/features/billing/lib/export'
import type {
  CustomerProfile,
  HistoryRow,
} from '@/features/billing/data/customers'
import { HistoryDetailDrawer } from './HistoryDetailDrawer'

interface Filters {
  search: string
  status: string
  method: string
  provider: string
  kind: string
  from: string
  to: string
}

const INITIAL: Filters = {
  search: '',
  status: 'ALL',
  method: 'ALL',
  provider: 'ALL',
  kind: 'ALL',
  from: '',
  to: '',
}

const EXPORT_COLUMNS = [
  { key: 'date' as const, label: 'Date' },
  { key: 'time' as const, label: 'Time' },
  { key: 'id' as const, label: 'Transaction' },
  { key: 'amount' as const, label: 'Amount' },
  { key: 'currency' as const, label: 'Currency' },
  { key: 'method' as const, label: 'Method' },
  { key: 'provider' as const, label: 'Provider' },
  { key: 'kind' as const, label: 'Type' },
  { key: 'statusLabel' as const, label: 'Status' },
]

function distinct(
  rows: HistoryRow[],
  key: keyof HistoryRow
): SelectFieldOption[] {
  return Array.from(new Set(rows.map(r => String(r[key])))).map(v => ({
    value: v,
    label: v,
  }))
}

export function CustomerHistory({
  rows,
  customerSlug,
  customer,
}: {
  rows: HistoryRow[]
  customerSlug: string
  customer: Pick<CustomerProfile, 'name' | 'email'>
}) {
  const [filters, setFilters] = useState<Filters>(INITIAL)
  const [selected, setSelected] = useState<HistoryRow | null>(null)
  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const methodOptions = useMemo(
    () => [{ value: 'ALL', label: 'All methods' }, ...distinct(rows, 'method')],
    [rows]
  )
  const providerOptions = useMemo(
    () => [
      { value: 'ALL', label: 'All providers' },
      ...distinct(rows, 'provider'),
    ],
    [rows]
  )

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    return rows.filter(r => {
      if (filters.status !== 'ALL' && r.statusLabel !== filters.status)
        return false
      if (filters.method !== 'ALL' && r.method !== filters.method) return false
      if (filters.provider !== 'ALL' && r.provider !== filters.provider)
        return false
      if (filters.kind !== 'ALL' && r.kind !== filters.kind) return false
      if (filters.from && r.date < filters.from) return false
      if (filters.to && r.date > filters.to) return false
      if (term && !`${r.id}${r.method}${r.amount}`.toLowerCase().includes(term))
        return false
      return true
    })
  }, [rows, debouncedSearch, filters])

  const { pageItems, state } = usePagination(filtered, 10)

  const set = (patch: Partial<Filters>) =>
    setFilters(prev => ({ ...prev, ...patch }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Transaction history</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="size-4" />
              Export
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                downloadXLS(
                  `${customerSlug}-transactions`,
                  filtered,
                  EXPORT_COLUMNS
                )
              }
            >
              Export as XLS
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                downloadJSON(`${customerSlug}-transactions`, filtered)
              }
            >
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        variant="card"
        columns={historyColumns}
        data={pageItems}
        rowKey={row => row.id}
        onRowClick={setSelected}
        pagination={state}
        emptyMessage="No transactions match these filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search txn id…"
              value={filters.search}
              onChange={e => set({ search: e.target.value })}
              className="w-full sm:w-48"
            />
            <SelectField
              className="w-36"
              value={filters.status}
              onChange={status => set({ status })}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'Paid', label: 'Paid' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Failed', label: 'Failed' },
                { value: 'Refunded', label: 'Refunded' },
              ]}
            />
            <SelectField
              className="w-36"
              value={filters.method}
              onChange={method => set({ method })}
              options={methodOptions}
            />
            <SelectField
              className="w-36"
              value={filters.provider}
              onChange={provider => set({ provider })}
              options={providerOptions}
            />
            <SelectField
              className="w-32"
              value={filters.kind}
              onChange={kind => set({ kind })}
              options={[
                { value: 'ALL', label: 'All types' },
                { value: 'Charge', label: 'Charge' },
                { value: 'Refund', label: 'Refund' },
              ]}
            />
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filters.from}
                onChange={e => set({ from: e.target.value })}
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                aria-label="From date"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <input
                type="date"
                value={filters.to}
                onChange={e => set({ to: e.target.value })}
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                aria-label="To date"
              />
            </div>
          </div>
        }
      />

      <HistoryDetailDrawer
        row={selected}
        customer={customer}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
