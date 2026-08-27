import * as React from 'react'
import { Info, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TONE, type Tone } from '@/lib/tone'
import { Card } from '@/components/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/tooltip'

export interface StatDelta {
  value: string
  direction: 'up' | 'down' | 'flat'
  invert?: boolean
}

export interface StatCardProps {
  label: string
  info?: React.ReactNode
  value: React.ReactNode
  sub?: React.ReactNode
  delta?: StatDelta
  hint?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  iconTone?: Tone
  aside?: React.ReactNode
  className?: string
}

function deltaTone(delta: StatDelta, type: 'border' | 'text') {
  if (delta.direction === 'flat') return TONE.neutral.text
  const good = delta.invert
    ? delta.direction === 'down'
    : delta.direction === 'up'
  return good ? TONE.success[type] : TONE.destructive[type]
}

export function StatCard({
  label,
  info,
  value,
  sub,
  delta,
  hint,
  icon: Icon,
  iconTone,
  aside,
  className,
}: StatCardProps) {
  const DeltaIcon =
    delta?.direction === 'up'
      ? TrendingUp
      : delta?.direction === 'down'
        ? TrendingDown
        : Minus

  return (
    <Card
      padding="sm"
      className={cn('h-full justify-between gap-2', className)}
    >
      <Card.Content className="space-y-4">
        <div className="flex items-center justify-between gap-1.5 text-sm font-semibold">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="truncate">{label}</span>
            {info ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`About ${label}`}
                    className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{info}</TooltipContent>
              </Tooltip>
            ) : null}
          </span>
          {Icon ? (
            <div className="rounded-full border p-2">
              <Icon
                className={cn(
                  'size-3.5 shrink-0',
                  iconTone && TONE[iconTone].text
                )}
              />
            </div>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
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
                <div className="inline-flex items-center gap-2">
                  <div
                    className={cn(
                      'font-semibold p-[2px] border-2 rounded-sm',
                      deltaTone(delta, 'border')
                    )}
                  >
                    <DeltaIcon className="size-3 stroke-3" />
                  </div>
                  <span className={cn(deltaTone(delta, 'text'))}>
                    {delta.value}
                  </span>
                </div>
              ) : null}
              {hint ? (
                <span className="text-muted-foreground">{hint}</span>
              ) : null}
            </div>
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      </Card.Content>
    </Card>
  )
}
