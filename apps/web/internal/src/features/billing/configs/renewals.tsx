import { type DataTableColumn } from '@rufieltics/ui'
import type { Renewal } from '@/features/billing/data/renewals'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'

export const renewalColumns: DataTableColumn<Renewal>[] = [
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
    id: 'plan',
    header: 'Plan',
    cell: row => (
      <div className="whitespace-nowrap">
        {row.plan}
        <span className="text-muted-foreground block text-[11px]">
          {row.mrr}/mo
        </span>
      </div>
    ),
  },
  {
    id: 'amount',
    header: 'Next charge',
    align: 'right',
    cell: row => (
      <span className="font-medium tabular-nums whitespace-nowrap">
        {row.amount}
        <span className="text-muted-foreground ml-1 text-[11px]">
          /{row.interval}
        </span>
      </span>
    ),
  },
  {
    id: 'when',
    header: 'Renews',
    cell: row => (
      <span className="whitespace-nowrap">
        {row.nextCharge}
        <span className="text-muted-foreground ml-1.5 text-[11px]">
          ({row.dueInDays}d)
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
        {row.methodExpires ? (
          <span className="text-muted-foreground text-[11px]">
            exp {row.methodExpires}
          </span>
        ) : null}
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
    id: 'status',
    header: 'Status',
    cell: row => (
      <TxnStatusBadge tone={row.statusTone}>{row.statusLabel}</TxnStatusBadge>
    ),
  },
]
