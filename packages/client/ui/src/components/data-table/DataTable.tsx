'use client'

import * as React from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table'
import { Skeleton } from '@/components/skeleton'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/button'
import { Card, CardContent } from '@/components/card'
import { cn } from '@/lib/utils'
import { Pagination } from './Pagination'
import type { DataTableColumn, PaginationState } from './types'

function formatAgo(ms: number) {
  const secs = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

function SyncBar({
  syncedAt,
  syncing,
  onRefetch,
}: {
  syncedAt: number
  syncing: boolean
  onRefetch: () => void
}) {
  const [, force] = React.useReducer(x => x + 1, 0)
  React.useEffect(() => {
    const id = setInterval(force, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
      <span aria-live="polite">
        {syncing ? 'Syncing…' : `Synced ${formatAgo(syncedAt)}`}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={onRefetch}
        disabled={syncing}
        aria-label="Refresh"
      >
        <RefreshCw className={cn('size-3.5', syncing && 'animate-spin')} />
      </Button>
    </div>
  )
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T, index: number) => string
  /** 'card' wraps the table in a Card; 'plain' renders bare (default). */
  variant?: 'plain' | 'card'
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  errorTitle?: string
  /** Re-fetching over existing data: keep rows, dim + mark busy. */
  isRefetching?: boolean
  emptyMessage?: React.ReactNode
  /** Custom content (filters, actions) rendered above the table. */
  toolbar?: React.ReactNode
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
  pagination?: PaginationState | false
  skeletonRows?: number
  className?: string
  /** Show the "Synced …" indicator + refresh button. Default true. */
  showSync?: boolean
  /** Called by the refresh button (and enables the sync bar). */
  onRefetch?: () => void
}

const alignClass = (align?: 'left' | 'center' | 'right') =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''

export function DataTable<T>({
  columns,
  data,
  rowKey,
  variant = 'plain',
  loading = false,
  error,
  onRetry,
  errorTitle,
  isRefetching = false,
  emptyMessage = 'No records found.',
  toolbar,
  onRowClick,
  rowClassName,
  pagination,
  skeletonRows = 5,
  className,
  showSync = true,
  onRefetch,
}: DataTableProps<T>) {
  const [syncedAt, setSyncedAt] = React.useState<number>(() => Date.now())
  React.useEffect(() => {
    if (!loading && !error) setSyncedAt(Date.now())
  }, [data, loading, error])

  const body = (
    <div className="space-y-4">
      {toolbar}

      {showSync && onRefetch && !error ? (
        <SyncBar
          syncedAt={syncedAt}
          syncing={isRefetching}
          onRefetch={onRefetch}
        />
      ) : null}

      {error ? (
        <ErrorState
          title={errorTitle}
          description={error}
          onRetry={onRetry}
          className="py-12"
        />
      ) : (
        <>
          <div
            className={cn(
              'relative w-full overflow-x-auto',
              isRefetching && 'pointer-events-none select-none'
            )}
          >
            {isRefetching ? (
              <div className="bg-background/40 absolute inset-0 z-10 flex items-start justify-center pt-10">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
              </div>
            ) : null}
            <Table className={className}>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead
                      key={col.id}
                      className={cn(
                        col.width,
                        alignClass(col.align),
                        col.headerClassName
                      )}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody
                aria-busy={isRefetching || undefined}
                className={cn(isRefetching && 'opacity-60 transition-opacity')}
              >
                {loading ? (
                  Array.from({ length: skeletonRows }).map((_, r) => (
                    <TableRow key={`skeleton-${r}`}>
                      {columns.map(col => (
                        <TableCell
                          key={col.id}
                          className={alignClass(col.align)}
                        >
                          <Skeleton className="h-5 w-24 max-w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-muted-foreground py-10 text-center text-sm"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => (
                    <TableRow
                      key={rowKey(row, index)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        onRowClick && 'hover:bg-muted/50 cursor-pointer',
                        rowClassName?.(row)
                      )}
                    >
                      {columns.map(col => (
                        <TableCell
                          key={col.id}
                          className={cn(alignClass(col.align), col.className)}
                        >
                          {col.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && !loading && data.length > 0 ? (
            <Pagination {...pagination} />
          ) : null}
        </>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card>
        <CardContent>{body}</CardContent>
      </Card>
    )
  }
  return body
}
