import { type DataTableColumn } from '@rufieltics/ui'
import type { HistoryRow } from '@/features/billing/data/customers'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

export const historyColumns: DataTableColumn<HistoryRow>[] = [
  {
    id: 'date',
    header: 'Date',
    cell: row => (
      <span className="whitespace-nowrap">
        {fmtDate(row.date)}
        <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
          {row.time}
        </span>
      </span>
    ),
  },
  {
    id: 'id',
    header: 'Transaction',
    cell: row => <span className="font-mono text-xs">{row.id}</span>,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    cell: row => (
      <span className="font-medium tabular-nums whitespace-nowrap">
        {row.amount}
        <span className="text-muted-foreground ml-1 text-[11px]">
          {row.currency}
        </span>
      </span>
    ),
  },
  {
    id: 'method',
    header: 'Method',
    cell: row => (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span
          className="size-2 rounded-full"
          style={{ background: row.methodColor }}
        />
        {row.method}
      </span>
    ),
  },
  {
    id: 'provider',
    header: 'Provider',
    cell: row => (
      <span className="text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs">
        {row.provider}
      </span>
    ),
  },
  {
    id: 'kind',
    header: 'Type',
    cell: row => (
      <span className="text-muted-foreground text-sm">{row.kind}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: row => (
      <TxnStatusBadge tone={row.status}>{row.statusLabel}</TxnStatusBadge>
    ),
  },
]
