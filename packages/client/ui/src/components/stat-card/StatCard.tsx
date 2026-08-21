import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TONE } from '@/lib/tone'
import { Card, CardContent } from '@/components/card'

export interface StatDelta {
  value: string
  direction: 'up' | 'down' | 'flat'
  /** When true, a downward move is good (e.g. churn, failure rate). */
  invert?: boolean
}

export interface StatCardProps {
  label: string
  value: React.ReactNode
  /** Secondary value shown next to the main one (e.g. a USD equivalent). */
  sub?: React.ReactNode
  delta?: StatDelta
  hint?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  /** Right-aligned decoration such as a sparkline. */
  aside?: React.ReactNode
  className?: string
}

function deltaTone(d: StatDelta) {
  if (d.direction === 'flat') return TONE.neutral.text
  const good = d.invert ? d.direction === 'down' : d.direction === 'up'
  return good ? TONE.success.text : TONE.destructive.text
}

export function StatCard({
  label,
  value,
  sub,
  delta,
  hint,
  icon: Icon,
  aside,
  className,
}: StatCardProps) {
  const DeltaIcon =
    delta?.direction === 'up'
      ? ArrowUpRight
      : delta?.direction === 'down'
        ? ArrowDownRight
        : Minus

  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            {Icon ? <Icon className="size-3.5" /> : null}
            {label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </span>
            {sub ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {sub}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {delta ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold',
                  deltaTone(delta)
                )}
              >
                <DeltaIcon className="size-3.5" />
                {delta.value}
              </span>
            ) : null}
            {hint ? (
              <span className="text-muted-foreground">{hint}</span>
            ) : null}
          </div>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </CardContent>
    </Card>
  )
}
