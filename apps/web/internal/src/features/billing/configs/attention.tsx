import { toast, type DataTableColumn } from '@rufieltics/ui'
import type { AttentionAccount } from '@/features/billing/data/attention'
import { RISK_TONE } from '@/features/billing/data/attention'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'

const account: DataTableColumn<AttentionAccount> = {
  id: 'account',
  header: 'Account',
  cell: row => (
    <div className="min-w-0">
      <div className="font-medium">{row.org}</div>
      <div className="text-muted-foreground truncate text-[11px]">
        {row.email} · {row.contact}
      </div>
    </div>
  ),
}

const plan: DataTableColumn<AttentionAccount> = {
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
}

const amount: DataTableColumn<AttentionAccount> = {
  id: 'amount',
  header: 'At risk',
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

const method: DataTableColumn<AttentionAccount> = {
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

const provider: DataTableColumn<AttentionAccount> = {
  id: 'provider',
  header: 'Provider',
  cell: row => (
    <span className="text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs">
      {row.provider}
    </span>
  ),
}

const status: DataTableColumn<AttentionAccount> = {
  id: 'status',
  header: 'Status',
  cell: row => (
    <div className="space-y-0.5">
      <TxnStatusBadge tone={row.statusTone}>{row.status}</TxnStatusBadge>
      {row.attempt ? (
        <div className="text-muted-foreground text-[11px]">
          Attempt {row.attempt}
        </div>
      ) : null}
    </div>
  ),
}

const reason: DataTableColumn<AttentionAccount> = {
  id: 'reason',
  header: 'Reason',
  cell: row => (
    <span className="text-muted-foreground text-sm whitespace-nowrap">
      {row.reason}
    </span>
  ),
}

const lastAttempt: DataTableColumn<AttentionAccount> = {
  id: 'lastAttempt',
  header: 'Last attempt',
  cell: row => (
    <span className="text-muted-foreground text-xs whitespace-nowrap">
      {row.lastAttempt}
    </span>
  ),
}

const nextAction: DataTableColumn<AttentionAccount> = {
  id: 'nextAction',
  header: 'Next action',
  cell: row => (
    <span className="text-xs whitespace-nowrap">{row.nextAction}</span>
  ),
}

const due: DataTableColumn<AttentionAccount> = {
  id: 'due',
  header: 'Due',
  cell: row => (
    <span className="font-mono text-xs whitespace-nowrap">{row.dueDate}</span>
  ),
}

const risk: DataTableColumn<AttentionAccount> = {
  id: 'risk',
  header: 'Risk',
  cell: row => (
    <TxnStatusBadge tone={RISK_TONE[row.risk]}>{row.risk}</TxnStatusBadge>
  ),
}

const action: DataTableColumn<AttentionAccount> = {
  id: 'action',
  header: '',
  align: 'right',
  width: 'w-0',
  cell: row => (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation()
        toast.success(`${row.action} · ${row.org}`)
      }}
      className="hover:bg-muted rounded-md border px-2 py-1 text-xs whitespace-nowrap"
    >
      {row.action}
    </button>
  ),
}

export const attentionColumns: DataTableColumn<AttentionAccount>[] = [
  account,
  plan,
  amount,
  method,
  provider,
  status,
  reason,
  lastAttempt,
  nextAction,
  due,
  risk,
  action,
]
