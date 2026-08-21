'use client'

import { useState } from 'react'
import { ArrowUpRight, RotateCw, Undo2, User } from 'lucide-react'
import {
  Button,
  ResponsiveDrawer,
  TONE,
  Timeline,
  cn,
  toast,
} from '@rufieltics/ui'
import { parseCurrency } from '@rufieltics/core-client'
import { providerSteps } from '@/features/billing/lib/transaction-steps'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { RefundModal } from '@/features/billing/components/shared/RefundModal'
import { buildRefundTarget } from '@/features/billing/lib/refund/refund-target'
import type { RefundTarget } from '@/features/billing/types/refund-types'
import type { TxnRow, TxnVariant } from '@/features/billing/data/transactions'

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

function toRefundTarget(row: TxnRow): RefundTarget {
  return buildRefundTarget({
    reference: row.id,
    customer: row.org,
    customerEmail: row.email,
    paidAmount: parseCurrency(row.amount, row.currency),
    currency: row.currency,
    method: {
      label: row.method,
      color: row.methodColor,
      account: '081288428842',
    },
  })
}

export function TransactionDetailDrawer({
  row,
  variant,
  onClose,
  onViewCustomer,
}: {
  row: TxnRow | null
  variant: TxnVariant
  onClose: () => void
  onViewCustomer: (row: TxnRow) => void
}) {
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null)

  const openRefund = (r: TxnRow) => {
    setRefundTarget(toRefundTarget(r))
    onClose()
    setRefundOpen(true)
  }

  const canRetry =
    row?.statusLabel === 'Failed' || row?.statusLabel === 'Requires action'
  const canRefund = variant === 'all' && row?.statusLabel === 'Paid'

  const footer = row ? (
    <>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => onViewCustomer(row)}
      >
        <User className="size-4" />
        View customer
      </Button>
      {canRetry ? (
        <Button
          className="flex-1"
          onClick={() => toast.success('Retry queued with provider')}
        >
          <RotateCw className="size-4" />
          Retry now
        </Button>
      ) : canRefund ? (
        <Button className="flex-1" onClick={() => openRefund(row)}>
          <Undo2 className="size-4" />
          Refund
        </Button>
      ) : null}
    </>
  ) : null

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
        footer={footer}
      >
        {row ? (
          <div className="space-y-5">
            <div>
              <Row label="Organization">
                <span className="font-medium">{row.org}</span>
                <span className="text-muted-foreground block text-xs">
                  {row.email}
                </span>
              </Row>
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
              <Row label="Date">
                <span className="font-mono text-xs">{row.date}</span>
              </Row>
            </div>

            {canRetry ? (
              <div
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs',
                  TONE.warning.soft
                )}
              >
                <span className="font-medium">Auto-retry is on</span>{' '}
                <span className="text-muted-foreground">
                  · next attempt in ~4h, then the subscription enters dunning.
                  Use Retry now to attempt immediately.
                </span>
              </div>
            ) : null}

            <div>
              <div className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                {variant === 'refunds'
                  ? 'Refund progress'
                  : 'Provider progress'}
              </div>
              <Timeline steps={providerSteps(row, variant)} />
            </div>

            <button
              type="button"
              onClick={() => onViewCustomer(row)}
              className="text-primary flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium"
            >
              View {row.org}&apos;s history &amp; payment methods
              <ArrowUpRight className="size-4" />
            </button>
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
