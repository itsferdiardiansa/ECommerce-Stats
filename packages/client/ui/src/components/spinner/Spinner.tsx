import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SpinnerProps {
  className?: string
  /** Fill and center within the available height (content-area loading). */
  fill?: boolean
  label?: string
}

export function Spinner({ className, fill = false, label }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        fill && 'min-h-[60vh] w-full flex-1',
        className
      )}
    >
      <Loader2
        className="text-muted-foreground size-6 animate-spin"
        aria-hidden="true"
      />
      {label ? (
        <span className="text-muted-foreground text-sm">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  )
}
