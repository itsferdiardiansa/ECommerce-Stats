import { cn } from '@/lib/utils'

export function FormError({
  message,
  className,
}: {
  message?: string | null
  className?: string
}) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={cn(
        'bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm',
        className
      )}
    >
      {message}
    </div>
  )
}
