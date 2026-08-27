'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import {
  Button,
  PaymentLogo,
  ResponsiveDrawer,
  TONE,
  cn,
  resolvePaymentKey,
  toast,
} from '@rufieltics/ui'
import {
  ATTENTION_TONE,
  type AttentionCategory,
} from '@/features/billing/data/attention'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { ProviderLogo } from '@/features/billing/components/shared/ProviderLogo'
import {
  attentionCategoryHref,
  attentionRecordHref,
} from '@/features/billing/components/attention/attention-nav'

export function AttentionDrawer({
  category,
  onClose,
}: {
  category: AttentionCategory | null
  onClose: () => void
}) {
  const router = useRouter()
  const href = category ? attentionCategoryHref(category.key) : '#'

  const openRecord = (account: AttentionCategory['accounts'][number]) => {
    if (!category) return
    onClose()
    router.push(attentionRecordHref(category.key, account))
  }

  const footer = category ? (
    <>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => {
          onClose()
          router.push(href)
        }}
      >
        View all {category.count}
        <ArrowUpRight className="size-4" />
      </Button>
      <Button
        className="flex-1"
        onClick={() => {
          toast.success(`${category.actionLabel} · ${category.label}`)
          onClose()
        }}
      >
        {category.actionLabel}
      </Button>
    </>
  ) : null

  return (
    <ResponsiveDrawer
      open={!!category}
      onOpenChange={open => !open && onClose()}
      title={
        category ? (
          <span className="flex items-center gap-2">
            {category.label}
            <span
              className={cn(
                'text-lg font-semibold tabular-nums',
                TONE[ATTENTION_TONE[category.tone]].text
              )}
            >
              {category.count}
            </span>
          </span>
        ) : null
      }
      description={
        category
          ? `${category.detail} · ${category.atRisk} at risk · ${category.slaLabel} ${category.sla}`
          : null
      }
      footer={footer}
    >
      {category ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">{category.summary}</p>

          <div className="flex flex-col gap-1">
            {category.accounts.map(account => (
              <div
                key={account.id}
                className="hover:bg-accent/40 flex items-start justify-between gap-3 rounded-lg p-3 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => openRecord(account)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-sm font-medium hover:underline">
                    {account.org}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {account.plan} · {account.contact}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="text-foreground/80 inline-flex items-center gap-1.5">
                      {resolvePaymentKey(account.method) ? (
                        <PaymentLogo name={account.method} className="h-4" />
                      ) : null}
                      {account.method}
                    </span>
                    <ProviderLogo name={account.provider} />
                    <span className="text-muted-foreground">
                      · {account.nextAction}
                    </span>
                  </div>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium tabular-nums">
                    {account.amount}
                  </span>
                  <TxnStatusBadge tone={account.statusTone}>
                    {account.status}
                  </TxnStatusBadge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-0.5 text-xs"
                    onClick={() =>
                      toast.success(`${account.action} · ${account.org}`)
                    }
                  >
                    {account.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {category.count > category.accounts.length ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                router.push(href)
              }}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            >
              Showing {category.accounts.length} of {category.count} · view all
              <ArrowUpRight className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </ResponsiveDrawer>
  )
}
