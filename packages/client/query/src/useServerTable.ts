'use client'

import { useRef, useState } from 'react'
import {
  keepPreviousData,
  useQuery,
  type QueryKey,
} from '@tanstack/react-query'
import type { PaginationState } from '@rufieltics/ui'
import { toMessage } from './errors'

export interface ServerPage<T> {
  items: T[]
  total: number
}

export interface ServerTableOptions<T> {
  /** Base key identifying the dataset + active filters (page is appended). */
  queryKey: QueryKey
  fetcher: (
    params: { page: number; pageSize: number },
    signal: AbortSignal
  ) => Promise<ServerPage<T>>
  initialPageSize?: number
  enabled?: boolean
}

export interface ServerTable<T> {
  items: T[]
  total: number
  status: 'pending' | 'error' | 'success'
  error: string | null
  /** Background refetch (incl. paging) over already-loaded data. */
  isRefetching: boolean
  reload: () => void
  pagination: PaginationState
  page: number
  pageSize: number
}

/**
 * Server-side table on TanStack Query: page/pageSize live here, the query is
 * keyed by `[...queryKey, page, pageSize]`, previous data is kept while paging
 * (no blank flash), and the page resets to 1 whenever `queryKey` changes.
 * Feed `pagination` straight to <DataTable /> and expect a `{ items, total }`
 * API.
 */
export function useServerTable<T>({
  queryKey,
  fetcher,
  initialPageSize = 10,
  enabled = true,
}: ServerTableOptions<T>): ServerTable<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const baseKey = JSON.stringify(queryKey)
  const keyRef = useRef(baseKey)
  if (keyRef.current !== baseKey) {
    keyRef.current = baseKey
    if (page !== 1) setPage(1)
  }

  const query = useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: ({ signal }) => fetcher({ page, pageSize }, signal),
    placeholderData: keepPreviousData,
    enabled,
  })

  const data = query.data ?? { items: [], total: 0 }

  const pagination: PaginationState = {
    page,
    pageSize,
    total: data.total,
    onPageChange: setPage,
    onPageSizeChange: size => {
      setPageSize(size)
      setPage(1)
    },
  }

  return {
    items: data.items,
    total: data.total,
    status: query.status,
    error: query.error ? toMessage(query.error) : null,
    isRefetching: query.isFetching && !query.isPending,
    reload: () => {
      void query.refetch()
    },
    pagination,
    page,
    pageSize,
  }
}
