'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  Hash,
  Info,
  Layers,
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
  ConfirmDialog,
  DashboardContentShell,
  SectionShell,
  StatList,
  Timeline,
  cn,
  toast,
} from '@rufieltics/ui'
import { slugify } from '@rufieltics/core'
import type { Dispute } from '@/features/billing/data/disputes'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { DetailField } from '@/features/billing/components/shared/DetailField'
import { PaymentMethodRow } from '@/features/billing/components/shared/PaymentMethodRow'
import { CustomerSummaryDrawer } from '@/features/billing/components/customers/CustomerSummaryDrawer'

export function DisputeDetail({ dispute }: { dispute: Dispute }) {
  const [customerOpen, setCustomerOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const editable = dispute.status === 'needs_response'
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(dispute.evidence.map(item => [item.key, item.provided]))
  )
  const [narrative, setNarrative] = useState('')

  const provided = Object.values(checked).filter(Boolean).length
  const total = dispute.evidence.length

  const toggle = (key: string) =>
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <DashboardContentShell
      headerComponent={
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
      }
    >
      <SectionShell>
        <StatList
          layout="carousel"
          itemClassName="w-64"
          ariaLabel="Dispute figures"
          items={[
            {
              label: 'Disputed',
              value: dispute.amount,
              hint: dispute.currency,
            },
            {
              label: 'Dispute fee',
              value: dispute.fee,
              hint: 'non-refundable',
            },
            {
              label: 'Respond by',
              value: editable ? `${dispute.dueInDays} days` : dispute.dueBy,
              hint: editable ? dispute.dueBy : 'no action needed',
            },
            {
              label: 'Evidence',
              value: `${provided}/${total}`,
              hint: 'documents attached',
            },
          ]}
        />
      </SectionShell>

      <SectionShell>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Alert>
              <Lightbulb className="size-4" />
              <AlertDescription>{dispute.recommended}</AlertDescription>
            </Alert>

            <Card>
              <Card.Header title="Case details" />
              <Card.Content className="space-y-4">
                <PaymentMethodRow
                  method={dispute.network}
                  provider={dispute.provider}
                  subtitle={dispute.method}
                />
                <section className="space-y-3">
                  <DetailField icon={Building2} label="Customer">
                    {dispute.org}
                    <span className="text-muted-foreground block text-xs font-normal">
                      {dispute.contact} · {dispute.email}
                    </span>
                  </DetailField>
                  <DetailField icon={Hash} label="Disputed charge">
                    <span className="font-mono text-xs">
                      {dispute.chargeId}
                    </span>
                    <span className="text-muted-foreground block text-xs font-normal">
                      {dispute.chargeDate}
                    </span>
                  </DetailField>
                  <DetailField icon={Layers} label="Plan">
                    {dispute.plan}
                  </DetailField>
                  <DetailField icon={Info} label="Reason">
                    {dispute.reason}
                  </DetailField>
                  <DetailField icon={CalendarDays} label="Opened">
                    {dispute.openedAt}
                  </DetailField>
                  <DetailField icon={CalendarClock} label="Evidence due">
                    {dispute.dueBy}
                  </DetailField>
                </section>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header title={`Evidence (${provided}/${total})`} />
              <Card.Content className="space-y-3">
                <div className="divide-y">
                  {dispute.evidence.map(item => {
                    const on = checked[item.key]
                    return (
                      <div
                        key={item.key}
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
                            <div className="text-sm font-medium">
                              {item.label}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {item.hint}
                            </div>
                          </div>
                        </div>
                        {editable ? (
                          <Button
                            variant={on ? 'ghost' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              toggle(item.key)
                              toast.success(
                                `${on ? 'Removed' : 'Attached'} ${item.label}`
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
                    onChange={event => setNarrative(event.target.value)}
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
              </Card.Content>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <Card.Header title="Timeline" />
              <Card.Content>
                <Timeline steps={dispute.timeline} />
              </Card.Content>
            </Card>
            <Card>
              <Card.Header title="Summary" />
              <Card.Content className="text-muted-foreground text-sm">
                {dispute.summary}
              </Card.Content>
            </Card>
          </div>
        </div>
      </SectionShell>

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
    </DashboardContentShell>
  )
}
