'use client'

import { useState } from 'react'
import { ArrowLeftRight, CalendarDays, Hash, Undo2 } from 'lucide-react'
import { Button, ResponsiveDrawer, Timeline } from '@rufieltics/ui'
import { historySteps } from '@/features/billing/lib/transaction-steps'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { DetailField } from '@/features/billing/components/shared/DetailField'
import { PaymentMethodRow } from '@/features/billing/components/shared/PaymentMethodRow'
import { RefundModal } from '@/features/billing/components/shared/RefundModal'
import { buildRefundTarget } from '@/features/billing/lib/refund/refund-target'
import type { RefundTarget } from '@/features/billing/types/refund-types'
import type {
  CustomerProfile,
  HistoryRow,
} from '@/features/billing/data/customers'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

function toRefundTarget(
  row: HistoryRow,
  customer: Pick<CustomerProfile, 'name' | 'email'>
): RefundTarget {
  return buildRefundTarget({
    reference: row.id,
    customer: customer.name,
    customerEmail: customer.email,
    paidAmount: row.amountValue,
    currency: row.currency,
    method: {
      label: row.method,
      color: row.methodColor,
      account: '081288428842',
    },
  })
}

export function HistoryDetailDrawer({
  row,
  customer,
  onClose,
}: {
  row: HistoryRow | null
  customer: Pick<CustomerProfile, 'name' | 'email'>
  onClose: () => void
}) {
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null)
  const canRefund = row?.kind === 'Charge' && row?.statusLabel === 'Paid'

  const openRefund = (r: HistoryRow) => {
    setRefundTarget(toRefundTarget(r, customer))
    onClose()
    setRefundOpen(true)
  }

  return (
    <>
      <ResponsiveDrawer
        open={!!row}
        onOpenChange={open => !open && onClose()}
        title={
          row ? (
            <span className="flex items-center gap-2">
              {row.amount}
              <span className="text-muted-foreground text-xs">
                {row.currency}
              </span>
              <TxnStatusBadge tone={row.status}>
                {row.statusLabel}
              </TxnStatusBadge>
            </span>
          ) : null
        }
        description={row ? <span className="font-mono">{row.id}</span> : null}
        footer={
          row && canRefund ? (
            <Button className="flex-1" onClick={() => openRefund(row)}>
              <Undo2 className="size-4" />
              Refund
            </Button>
          ) : undefined
        }
      >
        {row ? (
          <div className="space-y-6">
            <PaymentMethodRow
              method={row.method}
              provider={row.provider}
              subtitle="Payment method"
            />

            <section className="space-y-3">
              <DetailField icon={CalendarDays} label="Date">
                {fmtDate(row.date)}{' '}
                <span className="text-muted-foreground font-mono text-xs">
                  {row.time}
                </span>
              </DetailField>
              <DetailField icon={ArrowLeftRight} label="Type">
                {row.kind}
              </DetailField>
              <DetailField icon={Hash} label="Reference">
                <span className="font-mono text-xs">{row.id}</span>
              </DetailField>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-medium">
                {row.kind === 'Refund'
                  ? 'Refund progress'
                  : 'Provider progress'}
              </h3>
              <Timeline steps={historySteps(row)} />
            </section>
          </div>
        ) : null}
      </ResponsiveDrawer>

      <RefundModal
        target={refundTarget}
        open={refundOpen}
        onOpenChange={setRefundOpen}
      />
    </>
  )
}
