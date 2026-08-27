import * as React from 'react'
import { cn } from '@/lib/utils'
import { Carousel } from '@/components/carousel'
import { StatCard, type StatCardProps } from './StatCard'

export interface StatListItem extends StatCardProps {
  id?: string | number
}

export interface StatListProps {
  items: StatListItem[]
  layout?: 'row' | 'carousel'
  className?: string
  cardClassName?: string
  itemClassName?: string
  ariaLabel?: string
}

export function StatList({
  items,
  layout = 'row',
  className,
  cardClassName,
  itemClassName,
  ariaLabel,
}: StatListProps) {
  const cards = items.map(
    ({ id, className: itemCardClassName, ...item }, index) => (
      <StatCard
        key={id ?? item.label ?? index}
        {...item}
        className={cn(cardClassName, itemCardClassName)}
      />
    )
  )

  if (layout === 'carousel') {
    return (
      <Carousel
        className={className}
        itemClassName={itemClassName ?? 'w-64'}
        ariaLabel={ariaLabel}
      >
        {cards}
      </Carousel>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-stretch gap-4', className)}>
      {items.map((item, index) => (
        <div
          key={item.id ?? item.label ?? index}
          className={cn('min-w-[180px] flex-1', itemClassName)}
        >
          {cards[index]}
        </div>
      ))}
    </div>
  )
}
