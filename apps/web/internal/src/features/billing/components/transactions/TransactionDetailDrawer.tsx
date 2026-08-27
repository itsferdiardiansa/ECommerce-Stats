'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Hash,
  RotateCw,
  TriangleAlert,
  Undo2,
  User,
} from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  ResponsiveDrawer,
  Timeline,
  toast,
} from '@rufieltics/ui'
import { providerSteps } from '@/features/billing/lib/transaction-steps'
import { txnToRefundTarget } from '@/features/billing/lib/refund/txn-refund-target'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { DetailField } from '@/features/billing/components/shared/DetailField'
import { PaymentMethodRow } from '@/features/billing/components/shared/PaymentMethodRow'
import { RefundModal } from '@/features/billing/components/shared/RefundModal'
import type { RefundTarget } from '@/features/billing/types/refund-types'
import type { TxnRow, TxnVariant } from '@/features/billing/data/transactions'

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

  const openRefund = (target: TxnRow) => {
    setRefundTarget(txnToRefundTarget(target))
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
          <div className="space-y-6">
            <PaymentMethodRow
              method={row.method}
              provider={row.provider}
              subtitle="Payment method"
            />

            {canRetry ? (
              <Alert variant="warning">
                <TriangleAlert className="size-4" />
                <AlertTitle>Auto-retry is on</AlertTitle>
                <AlertDescription>
                  Next attempt in ~4h, then the subscription enters dunning. Use
                  Retry now to attempt immediately.
                </AlertDescription>
              </Alert>
            ) : null}

            <section className="space-y-3">
              <DetailField icon={Building2} label="Customer">
                {row.org}
                <span className="text-muted-foreground block text-xs font-normal">
                  {row.email}
                </span>
              </DetailField>
              <DetailField icon={Hash} label="Reference">
                <span className="font-mono text-xs">{row.id}</span>
              </DetailField>
              <DetailField icon={CalendarDays} label="Date">
                {row.date}
              </DetailField>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-medium">
                {variant === 'refunds'
                  ? 'Refund progress'
                  : 'Provider progress'}
              </h3>
              <Timeline steps={providerSteps(row, variant)} />
            </section>

            <button
              type="button"
              onClick={() => onViewCustomer(row)}
              className="hover:bg-accent/50 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <User className="text-muted-foreground size-4" />
                {row.org}&apos;s history &amp; payment methods
              </span>
              <ArrowUpRight className="text-muted-foreground size-4" />
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
