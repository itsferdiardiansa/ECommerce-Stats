'use client'

import { useMemo, useState } from 'react'
import type { PaginationState } from '@/components/data-table/types'

export interface ClientPagination<T> {
  pageItems: T[]
  state: PaginationState
}

/**
 * Client-side pagination: slices `items` for the current page and returns the
 * `PaginationState` to hand straight to <DataTable pagination={...} />.
 */
export function usePagination<T>(
  items: T[],
  initialPageSize = 10,
  pageSizeOptions: number[] = [10, 20, 50]
): ClientPagination<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount)

  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize]
  )

  return {
    pageItems,
    state: {
      page: current,
      pageSize,
      total,
      onPageChange: setPage,
      onPageSizeChange: size => {
        setPageSize(size)
        setPage(1)
      },
      pageSizeOptions,
    },
  }
}
