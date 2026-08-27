'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight, TriangleAlert } from 'lucide-react'
import { Button, Card } from '@rufieltics/ui'
import {
  ATTENTION_CATEGORIES,
  type AttentionCategory,
} from '@/features/billing/data/attention'

export function OverviewAttentionCard({
  onSelect,
}: {
  onSelect: (category: AttentionCategory) => void
}) {
  const router = useRouter()

  return (
    <Card bordered className="h-full gap-3">
      <Card.Header
        icon={TriangleAlert}
        title="Needs attention"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -mr-2 h-7 text-xs"
            onClick={() => router.push('/billing/attention')}
          >
            View all
            <ArrowUpRight className="size-3.5" />
          </Button>
        }
      />
      <Card.Content className="flex flex-col">
        {ATTENTION_CATEGORIES.map(category => (
          <button
            key={category.key}
            type="button"
            onClick={() => onSelect(category)}
            className="hover:bg-accent/40 flex flex-col gap-0.5 border-l-2 py-2 pl-4 text-left text-sm transition-colors"
          >
            <span className="font-semibold">{category.label}</span>
            <span className="text-muted-foreground">
              {category.count} · {category.atRisk} at risk · {category.slaLabel}{' '}
              {category.sla}
            </span>
          </button>
        ))}
      </Card.Content>
    </Card>
  )
}
