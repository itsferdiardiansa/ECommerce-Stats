import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="ml-auto text-right font-medium">{children}</span>
    </div>
  )
}
