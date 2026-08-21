'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Lightbulb,
  Paperclip,
  ShieldCheck,
  User,
} from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Carousel,
  ConfirmDialog,
  StatCard,
  Timeline,
  cn,
  toast,
} from '@rufieltics/ui'
import { slugify } from '@rufieltics/core-client'
import type { Dispute } from '@/features/billing/data/disputes'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { CustomerSummaryDrawer } from '@/features/billing/components/customers/CustomerSummaryDrawer'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t py-2 text-sm first:border-t-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

export function DisputeDetail({ dispute }: { dispute: Dispute }) {
  const [customerOpen, setCustomerOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const editable = dispute.status === 'needs_response'
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(dispute.evidence.map(e => [e.key, e.provided]))
  )
  const [narrative, setNarrative] = useState('')

  const provided = Object.values(checked).filter(Boolean).length
  const total = dispute.evidence.length

  const toggle = (key: string) =>
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/billing/disputes"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to disputes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <span className="font-mono">{dispute.id}</span>
              <TxnStatusBadge tone={dispute.statusTone}>
                {dispute.statusLabel}
              </TxnStatusBadge>
            </h1>
            <p className="text-muted-foreground text-sm">
              {dispute.org} · {dispute.reason} · {dispute.amount}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => setCustomerOpen(true)}>
              <User className="size-4" />
              View customer
            </Button>
          </div>
        </div>
      </div>

      <Carousel itemClassName="w-64" ariaLabel="Dispute figures">
        <StatCard
          label="Disputed"
          value={dispute.amount}
          hint={dispute.currency}
        />
        <StatCard
          label="Dispute fee"
          value={dispute.fee}
          hint="non-refundable"
        />
        <StatCard
          label="Respond by"
          value={editable ? `${dispute.dueInDays} days` : dispute.dueBy}
          hint={editable ? dispute.dueBy : 'no action needed'}
        />
        <StatCard
          label="Evidence"
          value={`${provided}/${total}`}
          hint="documents attached"
        />
      </Carousel>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Alert>
            <Lightbulb className="size-4" />
            <AlertDescription>{dispute.recommended}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Case details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Customer">
                {dispute.org}
                <span className="text-muted-foreground block text-xs font-normal">
                  {dispute.contact} · {dispute.email}
                </span>
              </Field>
              <Field label="Disputed charge">
                <span className="font-mono text-xs">{dispute.chargeId}</span>
                <span className="text-muted-foreground block text-xs font-normal">
                  {dispute.chargeDate}
                </span>
              </Field>
              <Field label="Plan">{dispute.plan}</Field>
              <Field label="Reason">{dispute.reason}</Field>
              <Field label="Network">
                {dispute.network}
                <span className="text-muted-foreground block text-xs font-normal">
                  {dispute.method}
                </span>
              </Field>
              <Field label="Provider">{dispute.provider}</Field>
              <Field label="Opened">{dispute.openedAt}</Field>
              <Field label="Evidence due">{dispute.dueBy}</Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Evidence ({provided}/{total})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="divide-y">
                {dispute.evidence.map(f => {
                  const on = checked[f.key]
                  return (
                    <div
                      key={f.key}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                            on
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-border text-transparent'
                          )}
                        >
                          <Check className="size-3" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{f.label}</div>
                          <div className="text-muted-foreground text-xs">
                            {f.hint}
                          </div>
                        </div>
                      </div>
                      {editable ? (
                        <Button
                          variant={on ? 'ghost' : 'outline'}
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            toggle(f.key)
                            toast.success(
                              `${on ? 'Removed' : 'Attached'} ${f.label}`
                            )
                          }}
                        >
                          <Paperclip className="size-3.5" />
                          {on ? 'Remove' : 'Attach'}
                        </Button>
                      ) : on ? (
                        <span className="text-muted-foreground text-xs">
                          Submitted
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Narrative to the network
                </label>
                <textarea
                  rows={4}
                  disabled={!editable}
                  value={narrative}
                  onChange={e => setNarrative(e.target.value)}
                  placeholder="Explain why this charge is legitimate. Reference the attached evidence."
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>

              {editable ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1"
                    onClick={() => setSubmitOpen(true)}
                  >
                    <ShieldCheck className="size-4" />
                    Submit evidence
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAcceptOpen(true)}
                  >
                    Accept dispute
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {dispute.status === 'under_review'
                    ? 'Evidence submitted. Awaiting the network decision.'
                    : 'This dispute is closed.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline steps={dispute.timeline} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {dispute.summary}
            </CardContent>
          </Card>
        </div>
      </div>

      <CustomerSummaryDrawer
        slug={customerOpen ? slugify(dispute.org) : null}
        from="disputes"
        onClose={() => setCustomerOpen(false)}
      />

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit evidence to the network?"
        description={
          <>
            {provided} of {total} documents will be sent to{' '}
            <span className="font-medium">{dispute.provider}</span> to contest{' '}
            <span className="font-medium">{dispute.amount}</span>. You
            can&apos;t add more evidence once submitted.
          </>
        }
        confirmLabel="Submit evidence"
        cancelLabel="Keep editing"
        onConfirm={() => {
          toast.success(`Evidence submitted for ${dispute.id}`)
        }}
      />

      <ConfirmDialog
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
        destructive
        title="Accept this dispute?"
        description={
          <>
            Accepting concedes the dispute:{' '}
            <span className="font-medium">{dispute.amount}</span> is refunded to
            the cardholder and the{' '}
            <span className="font-medium">{dispute.fee}</span> dispute fee is
            not returned. This is final.
          </>
        }
        confirmLabel="Accept dispute"
        cancelLabel="Cancel"
        onConfirm={() => {
          toast(`Dispute ${dispute.id} accepted`)
        }}
      />
    </div>
  )
}
