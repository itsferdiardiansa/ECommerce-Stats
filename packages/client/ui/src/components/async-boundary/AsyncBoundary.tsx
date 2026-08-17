'use client'

import * as React from 'react'
import { ErrorState } from '@/components/error-state'

/** Matches TanStack Query's status union. */
export type AsyncStatus = 'pending' | 'error' | 'success'

export interface AsyncBoundaryProps {
  status: AsyncStatus
  error?: string | null
  onRetry?: () => void
  /** Rendered while the initial request is in flight (a skeleton). */
  pending: React.ReactNode
  /** Success-but-no-data. When `isEmpty`, `empty` renders instead of children. */
  isEmpty?: boolean
  empty?: React.ReactNode
  errorTitle?: string
  children: React.ReactNode
}

/**
 * One place to branch loading → error → empty → success, so every fetched
 * section behaves the same: a skeleton while loading, the API's message plus a
 * retry on error, an empty state when there's no data.
 */
export function AsyncBoundary({
  status,
  error,
  onRetry,
  pending,
  isEmpty,
  empty,
  errorTitle,
  children,
}: AsyncBoundaryProps) {
  if (status === 'pending') return <>{pending}</>
  if (status === 'error') {
    return (
      <ErrorState
        title={errorTitle}
        description={error ?? undefined}
        onRetry={onRetry}
      />
    )
  }
  if (isEmpty && empty !== undefined) return <>{empty}</>
  return <>{children}</>
}
