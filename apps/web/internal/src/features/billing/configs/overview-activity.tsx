import {
  Activity,
  Banknote,
  Building2,
  Calendar,
  Clock,
  Landmark,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { DataTableColumn } from '@rufieltics/ui'
import type { RecentPayment } from '@/features/billing/data/overview'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { ProviderLogo } from '@/features/billing/components/shared/ProviderLogo'
import {
  paymentTimeLabel,
  type RenewalRow,
} from '@/features/billing/lib/overview-activity'

function Th({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 opacity-70" />
      {label}
    </span>
  )
}

export const paymentColumns: DataTableColumn<RecentPayment>[] = [
  {
    id: 'when',
    header: <Th icon={Clock} label="Time" />,
    cell: payment => (
      <span className="text-muted-foreground font-mono text-xs">
        {paymentTimeLabel(payment)}
      </span>
    ),
  },
  {
    id: 'org',
    header: <Th icon={Building2} label="Organization" />,
    cell: payment => <span className="font-medium">{payment.org}</span>,
  },
  {
    id: 'amount',
    header: <Th icon={Banknote} label="Amount" />,
    align: 'right',
    cell: payment => (
      <span className="font-medium tabular-nums">
        {payment.amount}
        <span className="text-muted-foreground ml-1 text-[11px]">
          {payment.currency}
        </span>
      </span>
    ),
  },
  {
    id: 'method',
    header: <Th icon={Wallet} label="Method" />,
    cell: payment => (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span
          className="size-2 rounded-full"
          style={{ background: payment.methodColor }}
        />
        {payment.method}
      </span>
    ),
  },
  {
    id: 'provider',
    header: <Th icon={Landmark} label="Provider" />,
    cell: payment => <ProviderLogo name={payment.provider} />,
  },
  {
    id: 'status',
    header: <Th icon={Activity} label="Status" />,
    cell: payment => (
      <TxnStatusBadge tone={payment.status}>
        {payment.statusLabel}
      </TxnStatusBadge>
    ),
  },
]

export const renewalColumns: DataTableColumn<RenewalRow>[] = [
  {
    id: 'org',
    header: 'Organization',
    cell: row =>
      row.type === 'group' ? (
        <span className="inline-flex items-center gap-2 font-semibold">
          <Calendar className="size-4" />
          {row.label}
        </span>
      ) : (
        <div className="flex flex-col pl-6">
          <span className="font-medium">{row.renewal.org}</span>
          <span className="text-muted-foreground text-xs">
            {row.renewal.plan} · {row.renewal.method}
          </span>
        </div>
      ),
  },
  {
    id: 'provider',
    header: 'Provider',
    cell: row =>
      row.type === 'renewal' ? (
        <ProviderLogo name={row.renewal.provider} />
      ) : null,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    cell: row =>
      row.type === 'renewal' ? (
        <span className="text-sm font-medium tabular-nums">
          {row.renewal.amount}
        </span>
      ) : null,
  },
]
