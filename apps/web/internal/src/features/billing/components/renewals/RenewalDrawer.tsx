'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Hash,
  Layers,
  MoreHorizontal,
  Receipt,
  RefreshCw,
  Repeat,
  TrendingUp,
  TriangleAlert,
  User,
} from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ResponsiveDrawer,
  toast,
} from '@rufieltics/ui'
import { slugify } from '@rufieltics/core'
import type { Renewal } from '@/features/billing/data/renewals'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { DetailField } from '@/features/billing/components/shared/DetailField'
import { PaymentMethodRow } from '@/features/billing/components/shared/PaymentMethodRow'
import { ChangePlanDialog } from './ChangePlanDialog'

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
        <div className="space-y-6">
          <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-xl p-4">
            <div>
              <div className="text-muted-foreground text-xs tracking-wide uppercase">
                Next charge
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {renewal.amount}
                </span>
                <span className="text-muted-foreground text-sm">
                  / {renewal.interval} · {renewal.nextCharge}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Manage subscription</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setPlanOpen(true)}>
                  <Layers className="size-4" />
                  Change plan
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant={renewal.autoRenew ? 'destructive' : 'default'}
                  onSelect={() => setRenewOpen(true)}
                >
                  <RefreshCw className="size-4" />
                  {renewal.autoRenew ? 'Pause auto-renew' : 'Resume auto-renew'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {renewal.riskNote ? (
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertDescription>{renewal.riskNote}</AlertDescription>
            </Alert>
          ) : null}

          <section>
            <h3 className="mb-3 text-sm font-medium">Payment method</h3>
            <PaymentMethodRow
              method={renewal.method}
              provider={renewal.provider}
              subtitle={`${renewal.methodAccount}${
                renewal.methodExpires ? ` · exp ${renewal.methodExpires}` : ''
              }`}
            />
          </section>

          <section className="space-y-3">
            <DetailField icon={Layers} label="Plan">
              {renewal.plan}
            </DetailField>
            <DetailField icon={Repeat} label="Billing interval">
              Every 1 {renewal.interval}
            </DetailField>
            <DetailField icon={TrendingUp} label="MRR">
              {renewal.mrr}
            </DetailField>
            <DetailField icon={User} label="Contact">
              {renewal.contact}
              <span className="text-muted-foreground block text-xs font-normal">
                {renewal.email}
              </span>
            </DetailField>
            <DetailField icon={RefreshCw} label="Auto-renew">
              {renewal.autoRenew ? 'On' : 'Off'}
            </DetailField>
            <DetailField icon={CalendarDays} label="Customer since">
              {renewal.since}
            </DetailField>
            <DetailField icon={Receipt} label="Last payment">
              {renewal.lastPayment}
            </DetailField>
            <DetailField icon={Hash} label="Subscription">
              <span className="font-mono text-xs">{renewal.id}</span>
            </DetailField>
          </section>
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
