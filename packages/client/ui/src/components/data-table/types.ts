import type * as React from 'react'

export interface DataTableColumn<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  /** Tailwind width utility for the column, e.g. 'w-0' or 'w-40'. */
  width?: string
  className?: string
  headerClassName?: string
}

export interface PaginationState {
  /** 1-based current page. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}
