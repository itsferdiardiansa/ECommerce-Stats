'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { Button, ResponsiveDrawer, TONE, cn, toast } from '@rufieltics/ui'
import {
  ATTENTION_TONE,
  type AttentionCategory,
} from '@/features/billing/data/attention'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
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

          <div className="divide-y">
            {category.accounts.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <button
                  type="button"
                  onClick={() => openRecord(a)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-sm font-medium hover:underline">
                    {a.org}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {a.plan} · {a.contact}
                  </div>
                  <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                    {a.nextAction}
                    <span className="rounded border px-1 py-0.5">
                      {a.provider}
                    </span>
                  </div>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium tabular-nums">
                    {a.amount}
                  </span>
                  <TxnStatusBadge tone={a.statusTone}>
                    {a.status}
                  </TxnStatusBadge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-0.5 text-xs"
                    onClick={() => toast.success(`${a.action} · ${a.org}`)}
                  >
                    {a.action}
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
