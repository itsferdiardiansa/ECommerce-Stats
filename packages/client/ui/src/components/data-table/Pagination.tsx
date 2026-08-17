'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/button'
import { SelectField } from '@/components/form'
import { cn } from '@/lib/utils'
import type { PaginationState } from './types'

export interface PaginationProps extends PaginationState {
  className?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className
      )}
    >
      <p className="text-muted-foreground text-sm">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange ? (
          <SelectField
            className="h-8 w-[4.5rem]"
            value={String(pageSize)}
            onChange={value => onPageSizeChange(Number(value))}
            options={pageSizeOptions.map(size => ({
              value: String(size),
              label: String(size),
            }))}
          />
        ) : null}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-muted-foreground px-1 text-sm tabular-nums">
            {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
