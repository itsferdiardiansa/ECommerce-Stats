'use client'

import { Checkbox } from '@rufieltics/ui'
import { formatCurrency, maskAccount, percentOf } from '@rufieltics/core'
import { REFUND_REASONS } from '@/features/billing/lib/refund/refund-constants'
import { taxPortionOf } from '@/features/billing/lib/refund/refund-tax'
import {
  estimatedArrival,
  nonRefundableFee,
} from '@/features/billing/lib/refund/refund-estimate'
import type {
  RefundTarget,
  RefundValues,
} from '@/features/billing/types/refund-types'
import { RefundReviewItem } from './RefundReviewItem'

export function RefundReview({
  target,
  values,
  onChange,
}: {
  target: RefundTarget
  values: RefundValues
  onChange: (patch: Partial<RefundValues>) => void
}) {
  const amount = values.amount ?? 0
  const pct = percentOf(values.amount, target.paidAmount)
  const tax = taxPortionOf(amount)
  const fee = nonRefundableFee(amount, target.method.label, values.currency)
  const arrival = estimatedArrival(target.method.label, values.currency)
  const isFull = values.mode === 'full'
  const reasonLabel =
    REFUND_REASONS.find(refundReason => refundReason.value === values.reason)
      ?.label ?? values.reason

  return (
    <div className="space-y-4">
      <div>
        <RefundReviewItem label="Refund to">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: target.method.color }}
            />
            {target.method.label}
          </span>
          {target.method.account ? (
            <span className="text-muted-foreground block font-mono text-xs font-normal">
              {maskAccount(target.method.account)}
            </span>
          ) : null}
          <span className="text-muted-foreground block text-xs font-normal">
            {target.customerEmail}
          </span>
        </RefundReviewItem>

        <RefundReviewItem label="Original charge">
          {formatCurrency(target.paidAmount, target.currency)}
        </RefundReviewItem>

        <RefundReviewItem label="Refund type">
          {isFull ? 'Full refund' : `Partial · ${pct}%`}
        </RefundReviewItem>

        <RefundReviewItem label="Reason">{reasonLabel}</RefundReviewItem>

        {target.plan ? (
          <RefundReviewItem label="Plan">
            {target.plan.name}
            <span className="text-muted-foreground font-normal">
              {' · '}
              {target.plan.price}
              {target.plan.interval ? ` / ${target.plan.interval}` : ''}
            </span>
          </RefundReviewItem>
        ) : null}

        <RefundReviewItem label="Estimated arrival">{arrival}</RefundReviewItem>

        <RefundReviewItem label="Includes PPN (11%)">
          {formatCurrency(tax, values.currency)}
        </RefundReviewItem>

        <RefundReviewItem label="Processing fee (not returned)" destructive>
          {formatCurrency(fee, values.currency)}
        </RefundReviewItem>

        {values.message ? (
          <RefundReviewItem label="Message">
            <span className="font-normal">{values.message}</span>
          </RefundReviewItem>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <div>
          <span className="text-sm font-medium">Total refund</span>
          <span className="text-muted-foreground block text-xs">
            Amount the customer receives
          </span>
        </div>
        <span className="text-lg font-semibold tabular-nums">
          {formatCurrency(amount, values.currency)}
        </span>
      </div>

      <label className="hover:bg-accent/50 flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors">
        <Checkbox
          checked={values.notify}
          onCheckedChange={notify => onChange({ notify })}
        />
        <span className="text-sm">
          Send a notification to the customer
          <span className="text-muted-foreground block text-xs">
            Emails {target.customerEmail} once the refund settles.
          </span>
        </span>
      </label>
    </div>
  )
}
