'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, TriangleAlert, User } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  ConfirmDialog,
  ResponsiveDrawer,
  toast,
} from '@rufieltics/ui'
import { slugify } from '@rufieltics/core-client'
import type { Renewal } from '@/features/billing/data/renewals'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { ChangePlanDialog } from './ChangePlanDialog'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

export function RenewalDrawer({
  renewal,
  from = 'renewals',
  onClose,
}: {
  renewal: Renewal | null
  from?: string
  onClose: () => void
}) {
  const router = useRouter()
  const [planOpen, setPlanOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)

  const footer = renewal ? (
    <>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => {
          onClose()
          router.push(`/billing/customers/${slugify(renewal.org)}?from=${from}`)
        }}
      >
        <User className="size-4" />
        View customer
      </Button>
      <Button className="flex-1" onClick={() => setUpdateOpen(true)}>
        Update payment method
      </Button>
    </>
  ) : null

  return (
    <ResponsiveDrawer
      open={!!renewal}
      onOpenChange={open => !open && onClose()}
      className="sm:max-w-[40vw]"
      title={
        renewal ? (
          <span className="flex items-center gap-2">
            {renewal.org}
            <TxnStatusBadge tone={renewal.statusTone}>
              {renewal.statusLabel}
            </TxnStatusBadge>
          </span>
        ) : null
      }
      description={
        renewal
          ? `Renews ${renewal.nextCharge} · in ${renewal.dueInDays} days`
          : null
      }
      footer={footer}
    >
      {renewal ? (
        <div className="space-y-5">
          <div className="bg-muted/50 rounded-lg px-4 py-3">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">
              Next charge
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {renewal.amount}
              </span>
              <span className="text-muted-foreground text-sm">
                / {renewal.interval} · {renewal.nextCharge}
              </span>
            </div>
          </div>

          {renewal.riskNote ? (
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertDescription>{renewal.riskNote}</AlertDescription>
            </Alert>
          ) : null}

          <section>
            <h3 className="mb-1 text-sm font-medium">Charged to</h3>
            <div className="flex items-center gap-3 rounded-lg px-1 py-1.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-white"
                style={{ background: renewal.methodColor }}
              >
                <CreditCard className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{renewal.method}</div>
                <div className="text-muted-foreground text-xs">
                  {renewal.methodAccount}
                  {renewal.methodExpires
                    ? ` · exp ${renewal.methodExpires}`
                    : ''}
                </div>
              </div>
              <span className="text-muted-foreground shrink-0 rounded-md border px-1.5 py-0.5 text-[11px]">
                {renewal.provider}
              </span>
            </div>
          </section>

          <section className="divide-border/60 divide-y">
            <Field label="Plan">{renewal.plan}</Field>
            <Field label="Billing interval">Every 1 {renewal.interval}</Field>
            <Field label="MRR">{renewal.mrr}</Field>
            <Field label="Contact">
              {renewal.contact}
              <span className="text-muted-foreground block text-xs font-normal">
                {renewal.email}
              </span>
            </Field>
            <Field label="Auto-renew">{renewal.autoRenew ? 'On' : 'Off'}</Field>
            <Field label="Customer since">{renewal.since}</Field>
            <Field label="Last payment">{renewal.lastPayment}</Field>
            <Field label="Subscription">
              <span className="font-mono text-xs">{renewal.id}</span>
            </Field>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlanOpen(true)}
            >
              Change plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenewOpen(true)}
            >
              {renewal.autoRenew ? 'Pause auto-renew' : 'Resume auto-renew'}
            </Button>
          </div>
        </div>
      ) : null}

      {renewal ? (
        <>
          <ChangePlanDialog
            renewal={renewal}
            open={planOpen}
            onOpenChange={setPlanOpen}
          />

          <ConfirmDialog
            open={updateOpen}
            onOpenChange={setUpdateOpen}
            title="Send a payment-method update link?"
            description={
              <>
                We&apos;ll email{' '}
                <span className="font-medium">{renewal.email}</span> a secure
                link to update the card on file. The renewal of{' '}
                <span className="font-medium">{renewal.amount}</span> on{' '}
                <span className="font-medium">{renewal.nextCharge}</span> will
                use the new method.
              </>
            }
            confirmLabel="Send link"
            cancelLabel="Cancel"
            onConfirm={() => {
              toast.success(`Update link emailed to ${renewal.email}`)
            }}
          />

          <ConfirmDialog
            open={renewOpen}
            onOpenChange={setRenewOpen}
            destructive={renewal.autoRenew}
            title={
              renewal.autoRenew ? 'Pause auto-renew?' : 'Resume auto-renew?'
            }
            description={
              renewal.autoRenew ? (
                <>
                  This subscription will lapse on{' '}
                  <span className="font-medium">{renewal.nextCharge}</span>{' '}
                  unless the customer renews manually.{' '}
                  <span className="font-medium">{renewal.org}</span> will be
                  notified by email.
                </>
              ) : (
                <>
                  Auto-renew will resume and{' '}
                  <span className="font-medium">{renewal.org}</span> will be
                  charged <span className="font-medium">{renewal.amount}</span>{' '}
                  on <span className="font-medium">{renewal.nextCharge}</span>.
                </>
              )
            }
            confirmLabel={
              renewal.autoRenew ? 'Pause auto-renew' : 'Resume auto-renew'
            }
            cancelLabel="Keep as is"
            onConfirm={() => {
              toast.success(
                renewal.autoRenew
                  ? `Auto-renew paused for ${renewal.org}`
                  : `Auto-renew resumed for ${renewal.org}`
              )
            }}
          />
        </>
      ) : null}
    </ResponsiveDrawer>
  )
}
