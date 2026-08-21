import type { ReactNode } from 'react'
import { cn } from '@rufieltics/ui'

export function RefundReviewItem({
  label,
  destructive,
  children,
}: {
  label: string
  destructive?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span
        className={cn(
          'text-muted-foreground',
          destructive && 'text-destructive'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-right font-medium tabular-nums',
          destructive && 'text-destructive'
        )}
      >
        {children}
      </span>
    </div>
  )
}
