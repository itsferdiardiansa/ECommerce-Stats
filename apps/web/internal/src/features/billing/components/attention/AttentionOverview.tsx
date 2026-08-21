'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Carousel,
  StatCard,
} from '@rufieltics/ui'
import { ATTENTION_CATEGORIES } from '@/features/billing/data/attention'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { ATTENTION_ICON } from './attention-icons'
import { attentionCategoryHref, attentionRecordHref } from './attention-nav'

export function AttentionOverview() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Needs attention</h1>
        <p className="text-muted-foreground text-sm">
          Accounts and payments that need a human before revenue is lost.
        </p>
      </div>

      <Carousel itemClassName="w-72" ariaLabel="Attention summary">
        {ATTENTION_CATEGORIES.map(c => (
          <StatCard
            key={c.key}
            label={c.label}
            value={String(c.count)}
            hint={`${c.atRisk} at risk`}
            icon={ATTENTION_ICON[c.key]}
          />
        ))}
      </Carousel>

      {ATTENTION_CATEGORIES.map(category => {
        const Icon = ATTENTION_ICON[category.key]
        const href = attentionCategoryHref(category.key)
        return (
          <Card key={category.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Icon className="size-4 shrink-0" />
                {category.label}
                <span className="text-muted-foreground text-xs font-normal">
                  · {category.count} · {category.atRisk} at risk ·{' '}
                  {category.slaLabel} {category.sla}
                </span>
              </CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground -my-1 text-xs"
                  onClick={() => router.push(href)}
                >
                  View all {category.count}
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 text-sm">
                {category.summary}
              </p>
              <div className="divide-y">
                {category.accounts.slice(0, 3).map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      router.push(attentionRecordHref(category.key, a))
                    }
                    className="hover:bg-accent/40 -mx-2 grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors sm:grid-cols-[1.4fr_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {a.org}
                      </div>
                      <div className="text-muted-foreground truncate text-[11px]">
                        {a.plan} · {a.contact} · {a.provider}
                      </div>
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <div className="truncate text-xs">{a.nextAction}</div>
                      <div className="text-muted-foreground text-[11px]">
                        {a.reason}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular-nums">
                        {a.amount}
                      </span>
                      <TxnStatusBadge tone={a.statusTone}>
                        {a.status}
                      </TxnStatusBadge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
