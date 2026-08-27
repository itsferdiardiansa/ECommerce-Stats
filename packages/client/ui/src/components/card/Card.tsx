import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { pickSlots } from '@/lib/slots'
import { LucideIcon } from 'lucide-react'

const cardVariants = cva(
  'bg-card text-card-foreground flex flex-col gap-6 rounded-xl',
  {
    variants: {
      padding: {
        none: 'p-0',
        xs: 'p-1.5',
        sm: 'p-3',
        md: 'p-5',
      },
      bordered: {
        true: 'border',
        false: '',
      },
    },
    defaultVariants: {
      padding: 'sm',
      bordered: true,
    },
  }
)

export type CardProps = React.ComponentProps<'div'> &
  VariantProps<typeof cardVariants>

function CardComponent({
  className,
  padding,
  bordered,
  children,
  ...props
}: CardProps) {
  const { slots, rest } = pickSlots(children, {
    header: CardHeaderSlot,
    content: CardContentSlot,
  })

  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ padding, bordered }), className)}
      {...props}
    >
      {slots.header}
      {slots.content}
      {rest}
    </div>
  )
}

function CardContentSlot({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-content" className={cn(className)} {...props}>
      {children}
    </div>
  )
}

const CardHeaderSlot: React.FC<
  React.PropsWithChildren<{
    title?: string
    icon?: LucideIcon
    className?: string
    action?: React.ReactNode
  }>
> = ({ children, icon: Icon, title, className, action }) => {
  return (
    <div
      data-slot="card-header"
      className={cn('flex items-center gap-2 pb-3', className)}
    >
      {children ? (
        children
      ) : (
        <>
          {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
          <span className="text-sm font-medium">{title}</span>
          {action ? <div className="ml-auto">{action}</div> : null}
        </>
      )}
    </div>
  )
}

export { CardComponent, CardHeaderSlot, CardContentSlot }
