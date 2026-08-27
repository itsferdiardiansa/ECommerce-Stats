import { cn } from '@/lib/utils'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({
  orientation = 'horizontal',
  className,
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('flex self-stretch px-4 md:px-6', className)}
      >
        <div className="bg-border w-px flex-1" />
      </div>
    )
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('py-4 md:py-6', className)}
    >
      <div className="bg-border h-px w-full" />
    </div>
  )
}
