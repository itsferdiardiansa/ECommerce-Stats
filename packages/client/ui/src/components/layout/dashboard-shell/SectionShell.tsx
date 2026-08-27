import { cn } from '@/lib/utils'

export function SectionShell({
  className,
  children,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('p-4 md:p-6 border-t', className)}>
      {children}
    </section>
  )
}
