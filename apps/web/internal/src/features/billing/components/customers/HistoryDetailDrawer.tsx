'use client'

import { useState } from 'react'
import { Undo2 } from 'lucide-react'
import { Button, ResponsiveDrawer, Timeline } from '@rufieltics/ui'
import { historySteps } from '@/features/billing/lib/transaction-steps'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
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

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t py-2 text-sm first:border-t-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  )
}

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
          <div className="space-y-5">
            <div>
              <Row label="Date">
                <span>{fmtDate(row.date)}</span>{' '}
                <span className="text-muted-foreground font-mono text-xs">
                  {row.time}
                </span>
              </Row>
              <Row label="Type">{row.kind}</Row>
              <Row label="Method">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: row.methodColor }}
                  />
                  {row.method}
                </span>
              </Row>
              <Row label="Provider">
                <span className="text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs">
                  {row.provider}
                </span>
              </Row>
            </div>

            <div>
              <div className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                {row.kind === 'Refund'
                  ? 'Refund progress'
                  : 'Provider progress'}
              </div>
              <Timeline steps={historySteps(row)} />
            </div>
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
