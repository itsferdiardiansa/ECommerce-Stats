import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/button'
import errorSnap from '@/assets/error-snap.svg'

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = 'Oops, something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 px-6 py-10 text-center',
        className
      )}
    >
      <img
        src={typeof errorSnap === 'string' ? errorSnap : errorSnap.src}
        alt=""
        className="size-24"
      />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="size-4" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
