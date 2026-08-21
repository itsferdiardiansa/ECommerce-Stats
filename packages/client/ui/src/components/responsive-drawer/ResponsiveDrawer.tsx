'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/useMobile'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/sheet'

export interface ResponsiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  /** Rendered pinned at the bottom (actions). */
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/**
 * A detail panel that slides in from the right on desktop and up from the
 * bottom on mobile. Header + scrollable body + optional sticky footer.
 */
export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  footer,
  className,
  children,
}: ResponsiveDrawerProps) {
  const isMobile = useIsMobile()
  const side = isMobile ? 'bottom' : 'right'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'flex flex-col gap-0 p-0',
          side === 'right' && 'w-full sm:max-w-md',
          side === 'bottom' && 'max-h-[88vh] rounded-t-xl',
          className
        )}
      >
        {title ? (
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : (
              <SheetDescription className="sr-only">Details</SheetDescription>
            )}
          </SheetHeader>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer ? (
          <div className="flex gap-2 border-t px-5 py-3">{footer}</div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
