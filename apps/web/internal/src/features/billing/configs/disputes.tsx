import { TONE, cn, type DataTableColumn } from '@rufieltics/ui'
import type { Dispute } from '@/features/billing/data/disputes'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'

export const disputeColumns: DataTableColumn<Dispute>[] = [
  {
    id: 'id',
    header: 'Dispute',
    cell: row => (
      <div className="min-w-0">
        <div className="font-mono text-xs">{row.id}</div>
        <div className="text-muted-foreground truncate text-[11px]">
          {row.chargeId}
        </div>
      </div>
    ),
  },
  {
    id: 'org',
    header: 'Customer',
    cell: row => (
      <div className="min-w-0">
        <div className="font-medium">{row.org}</div>
        <div className="text-muted-foreground truncate text-[11px]">
          {row.email}
        </div>
      </div>
    ),
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
    id: 'reason',
    header: 'Reason',
    cell: row => (
      <span className="text-sm whitespace-nowrap">{row.reason}</span>
    ),
  },
  {
    id: 'network',
    header: 'Network',
    cell: row => (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {row.network}
        <span className="text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs">
          {row.provider}
        </span>
      </span>
    ),
  },
  {
    id: 'opened',
    header: 'Opened',
    cell: row => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.openedAt}
      </span>
    ),
  },
  {
    id: 'due',
    header: 'Respond by',
    cell: row =>
      row.status === 'needs_response' ? (
        <span
          className={cn('font-medium whitespace-nowrap', TONE.destructive.text)}
        >
          {row.dueBy}
          <span className="ml-1 text-[11px]">({row.dueInDays}d)</span>
        </span>
      ) : (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {row.dueBy}
        </span>
      ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: row => (
      <TxnStatusBadge tone={row.statusTone}>{row.statusLabel}</TxnStatusBadge>
    ),
  },
]
