import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('text-muted-foreground animate-spin', className)} />
  )
}

export function Loading({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex justify-center py-10', className)}
    >
      <Spinner className="size-6" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
