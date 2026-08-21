import { ReceiptText } from 'lucide-react'
import { toast, type DataTableColumn } from '@rufieltics/ui'
import type { TxnRow, TxnVariant } from '@/features/billing/data/transactions'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'

const when: DataTableColumn<TxnRow> = {
  id: 'when',
  header: 'Date',
  cell: row => (
    <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
      {row.date}
    </span>
  ),
}

const org: DataTableColumn<TxnRow> = {
  id: 'org',
  header: 'Organization',
  cell: row => (
    <span className="font-medium">
      {row.org}
      <span className="text-muted-foreground block text-[11px] font-normal">
        {row.email}
      </span>
    </span>
  ),
}

const amount: DataTableColumn<TxnRow> = {
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
}

const method: DataTableColumn<TxnRow> = {
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
}

const provider: DataTableColumn<TxnRow> = {
  id: 'provider',
  header: 'Provider',
  cell: row => (
    <span className="text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs">
      {row.provider}
    </span>
  ),
}

const reason: DataTableColumn<TxnRow> = {
  id: 'reason',
  header: 'Reason',
  cell: row => (
    <span className="text-muted-foreground text-sm">{row.reason ?? '-'}</span>
  ),
}

const attempts: DataTableColumn<TxnRow> = {
  id: 'attempts',
  header: 'Attempts',
  align: 'right',
  cell: row => <span className="tabular-nums">{row.attempts ?? '-'}</span>,
}

const status: DataTableColumn<TxnRow> = {
  id: 'status',
  header: 'Status',
  cell: row => (
    <TxnStatusBadge tone={row.status}>{row.statusLabel}</TxnStatusBadge>
  ),
}

const report: DataTableColumn<TxnRow> = {
  id: 'report',
  header: 'Receipt',
  align: 'right',
  width: 'w-0',
  cell: row => (
    <button
      type="button"
      title={`Open ${row.provider} receipt`}
      aria-label={`Open ${row.provider} receipt`}
      onClick={event => {
        event.stopPropagation()
        toast(`Opening ${row.provider} receipt for ${row.id}…`)
      }}
      className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-md"
    >
      <ReceiptText className="size-4" />
    </button>
  ),
}

export function transactionColumns(
  variant: TxnVariant
): DataTableColumn<TxnRow>[] {
  if (variant === 'refunds') {
    return [when, org, amount, method, provider, reason, status, report]
  }
  if (variant === 'failed') {
    return [when, org, amount, method, reason, attempts, status, report]
  }
  return [when, org, amount, method, provider, status, report]
}
