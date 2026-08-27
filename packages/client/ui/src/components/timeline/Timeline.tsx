import * as React from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TimelineStatus = 'done' | 'current' | 'pending' | 'failed'

export interface TimelineStep {
  title: string
  time?: string
  note?: React.ReactNode
  status?: TimelineStatus
}

const DOT: Record<TimelineStatus, string> = {
  done: 'bg-emerald-500 border-emerald-500 text-white',
  current: 'bg-indigo-500 border-indigo-500 text-white',
  failed: 'bg-rose-500 border-rose-500 text-white',
  pending: 'bg-background border-border text-transparent',
}

/** Vertical step / event timeline - provider ceremony steps, audit trails, etc. */
export function Timeline({
  steps,
  className,
}: {
  steps: TimelineStep[]
  className?: string
}) {
  return (
    <ol className={cn('relative space-y-0', className)}>
      {steps.map((step, index) => {
        const status = step.status ?? 'pending'
        const last = index === steps.length - 1
        return (
          <li key={index} className="relative flex gap-3 pb-4 last:pb-0">
            {!last ? (
              <span
                className="bg-border absolute top-5 left-[9px] h-full w-px"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                'z-10 mt-0.5 flex size-[19px] shrink-0 items-center justify-center rounded-full border-2',
                DOT[status]
              )}
            >
              {status === 'done' ? (
                <Check className="size-2.5" strokeWidth={3} />
              ) : status === 'failed' ? (
                <X className="size-2.5" strokeWidth={3} />
              ) : status === 'current' ? (
                <span className="size-1.5 rounded-full bg-white" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{step.title}</span>
                {step.time ? (
                  <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                    {step.time}
                  </span>
                ) : null}
              </div>
              {step.note ? (
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {step.note}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
