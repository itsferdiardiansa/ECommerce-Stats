'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

type ValueType = string | boolean | number

export interface SegmentedTabOption<T extends ValueType> {
  value: T
  label: ReactNode
}

const listVariants = cva('relative inline-flex', {
  variants: {
    variant: {
      default: 'bg-muted rounded-lg p-1',
      ghost: 'bg-transparent p-0',
    },
  },
  defaultVariants: { variant: 'default' },
})

const indicatorVariants = cva(
  'pointer-events-none absolute transition-[left,width] duration-200 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-background inset-y-1 rounded-md shadow-sm',
        ghost: 'bg-primary inset-y-0 rounded-md',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const tabVariants = cva(
  'relative z-10 cursor-pointer rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      variant: { default: '', ghost: '' },
      active: {
        true: '',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    compoundVariants: [
      { variant: 'default', active: true, class: 'text-foreground' },
      { variant: 'ghost', active: true, class: 'text-primary-foreground' },
    ],
    defaultVariants: { variant: 'default', active: false },
  }
)

export interface SegmentedTabsProps<T extends ValueType>
  extends VariantProps<typeof listVariants> {
  value: T
  onChange: (value: T) => void
  options: SegmentedTabOption<T>[]
  className?: string
  ariaLabel?: string
}

export function SegmentedTabs<T extends ValueType>({
  value,
  onChange,
  options,
  variant,
  className,
  ariaLabel,
}: SegmentedTabsProps<T>) {
  const index = Math.max(
    0,
    options.findIndex(option => option.value === value)
  )
  const listRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const sync = () => {
      const el = btnRefs.current[index]
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    sync()
    const list = listRef.current
    if (!list) return
    const ro = new ResizeObserver(sync)
    ro.observe(list)
    return () => ro.disconnect()
  }, [index, options])

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(listVariants({ variant }), className)}
    >
      <span
        aria-hidden
        className={indicatorVariants({ variant })}
        style={{ left: indicator.left, width: indicator.width }}
      />
      {options.map((option, index) => {
        const active = option.value === value
        return (
          <button
            key={option.value as string}
            ref={el => {
              btnRefs.current[index] = el
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={tabVariants({ variant, active })}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
