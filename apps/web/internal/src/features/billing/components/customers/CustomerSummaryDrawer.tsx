'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, CreditCard } from 'lucide-react'
import {
  Badge,
  Button,
  PaymentLogo,
  ResponsiveDrawer,
  TONE,
  cn,
  resolvePaymentKey,
  type Tone,
} from '@rufieltics/ui'
import { ProviderLogo } from '@/features/billing/components/shared/ProviderLogo'
import {
  getCustomer,
  type PaymentMethodView,
  type PlanEvent,
} from '@/features/billing/data/customers'

const PLAN_TONE: Record<PlanEvent['tone'], Tone> = {
  up: 'success',
  down: 'destructive',
  neutral: 'neutral',
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2">
      <div className="text-muted-foreground text-[11px] tracking-wide uppercase">
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}

function ExpandableList<T>({
  items,
  preview,
  keyOf,
  render,
  noun,
}: {
  items: T[]
  preview: number
  keyOf: (item: T, index: number) => string
  render: (item: T) => React.ReactNode
  noun: string
}) {
  const [open, setOpen] = useState(false)
  const extra = items.length - preview
  const shown = open ? items : items.slice(0, preview)

  return (
    <>
      <div className={cn('flex flex-col', open && 'max-h-64 overflow-y-auto')}>
        {shown.map((item, index) => (
          <div key={keyOf(item, index)}>{render(item)}</div>
        ))}
      </div>
      {extra > 0 ? (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-xs font-medium"
        >
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform',
              open && 'rotate-180'
            )}
          />
          {open ? 'Show less' : `Show all ${items.length} ${noun}`}
        </button>
      ) : null}
    </>
  )
}

function MethodRow(method: PaymentMethodView) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span className="flex size-9 shrink-0 items-center justify-center">
        {resolvePaymentKey(method.label) ? (
          <PaymentLogo name={method.label} className="h-6" />
        ) : (
          <CreditCard className="text-muted-foreground size-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{method.label}</span>
          {method.isDefault ? (
            <Badge variant="secondary" className="text-[10px]">
              Default
            </Badge>
          ) : null}
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {method.detail}
          {method.expires ? ` · exp ${method.expires}` : ''}
        </div>
      </div>
      <ProviderLogo name={method.provider} className="shrink-0" />
    </div>
  )
}

function PlanRow(e: PlanEvent) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          TONE[PLAN_TONE[e.tone]].dot
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{e.title}</div>
        {e.note ? (
          <div className="text-muted-foreground text-xs">{e.note}</div>
        ) : null}
      </div>
      <span className="text-muted-foreground shrink-0 text-xs">{e.date}</span>
    </div>
  )
}

export function CustomerSummaryDrawer({
  slug,
  from = 'disputes',
  onClose,
}: {
  slug: string | null
  from?: string
  onClose: () => void
}) {
  const router = useRouter()
  const customer = slug ? getCustomer(slug) : null

  const footer = customer ? (
    <Button
      className="flex-1"
      onClick={() => {
        onClose()
        router.push(`/billing/customers/${customer.slug}?from=${from}`)
      }}
    >
      Open full profile
      <ArrowUpRight className="size-4" />
    </Button>
  ) : null

  return (
    <ResponsiveDrawer
      open={!!customer}
      onOpenChange={open => !open && onClose()}
      className="sm:max-w-[40vw]"
      title={
        customer ? (
          <span className="flex items-center gap-2">
            {customer.name}
            <Badge className={TONE.success.soft}>{customer.status}</Badge>
          </span>
        ) : null
      }
      description={customer?.email}
      footer={footer}
    >
      {customer ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Plan" value={customer.plan} />
            <Stat label="Lifetime" value={customer.lifetimeValue} />
            <Stat label="Since" value={customer.since} />
          </div>

          <section className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Payment methods</h3>
              <span className="text-muted-foreground text-xs">
                {customer.methods.length} on file
              </span>
            </div>
            <ExpandableList
              items={customer.methods}
              preview={3}
              noun="methods"
              keyOf={m => m.id}
              render={m => <MethodRow {...m} />}
            />
          </section>

          <section className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Plan history</h3>
              <span className="text-muted-foreground text-xs">
                {customer.planHistory.length} changes
              </span>
            </div>
            <ExpandableList
              items={customer.planHistory}
              preview={3}
              noun="changes"
              keyOf={(_, index) => String(index)}
              render={e => <PlanRow {...e} />}
            />
          </section>
        </div>
      ) : null}
    </ResponsiveDrawer>
  )
}
