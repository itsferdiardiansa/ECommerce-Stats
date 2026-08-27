'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import {
  Button,
  Card,
  DashboardContentShell,
  SectionShell,
  StatList,
} from '@rufieltics/ui'
import { ATTENTION_CATEGORIES } from '@/features/billing/data/attention'
import { TxnStatusBadge } from '@/features/billing/components/shared/TxnStatusBadge'
import { ATTENTION_ICON } from './attention-icons'
import { attentionCategoryHref, attentionRecordHref } from './attention-nav'

export function AttentionOverview() {
  const router = useRouter()

  return (
    <DashboardContentShell
      title="Needs attention"
      subTitle="Accounts and payments that need a human before revenue is lost."
    >
      <SectionShell>
        <StatList
          layout="carousel"
          itemClassName="w-72"
          ariaLabel="Attention summary"
          items={ATTENTION_CATEGORIES.map(attentionCategory => ({
            id: attentionCategory.key,
            label: attentionCategory.label,
            value: String(attentionCategory.count),
            hint: `${attentionCategory.atRisk} at risk`,
            icon: ATTENTION_ICON[attentionCategory.key],
          }))}
        />
      </SectionShell>

      <SectionShell className="flex flex-col gap-4">
        {ATTENTION_CATEGORIES.map(category => {
          const Icon = ATTENTION_ICON[category.key]
          const href = attentionCategoryHref(category.key)
          return (
            <Card key={category.key}>
              <Card.Header className="flex-wrap">
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <span className="text-sm font-medium">{category.label}</span>
                <span className="text-muted-foreground text-xs font-normal">
                  · {category.count} · {category.atRisk} at risk ·{' '}
                  {category.slaLabel} {category.sla}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground -my-1 ml-auto text-xs"
                  onClick={() => router.push(href)}
                >
                  View all {category.count}
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </Card.Header>
              <Card.Content>
                <p className="text-muted-foreground mb-3 text-sm">
                  {category.summary}
                </p>
                <div className="divide-y">
                  {category.accounts.slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        router.push(attentionRecordHref(category.key, item))
                      }
                      className="hover:bg-accent/40 -mx-2 grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors sm:grid-cols-[1.4fr_1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {item.org}
                        </div>
                        <div className="text-muted-foreground truncate text-[11px]">
                          {item.plan} · {item.contact} · {item.provider}
                        </div>
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <div className="truncate text-xs">
                          {item.nextAction}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {item.reason}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium tabular-nums">
                          {item.amount}
                        </span>
                        <TxnStatusBadge tone={item.statusTone}>
                          {item.status}
                        </TxnStatusBadge>
                      </div>
                    </button>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )
        })}
      </SectionShell>
    </DashboardContentShell>
  )
}
