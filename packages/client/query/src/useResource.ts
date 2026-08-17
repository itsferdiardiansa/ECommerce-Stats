'use client'

import { useQuery, type QueryKey } from '@tanstack/react-query'
import { toMessage } from './errors'

export interface Resource<T> {
  data: T | undefined
  status: 'pending' | 'error' | 'success'
  error: string | null
  isFetching: boolean
  isRefetching: boolean
  refetch: () => void
}

/**
 * A single cached fetch: pass a stable `queryKey` and a fetcher that honors the
 * abort `signal`. Returns a normalized `{ status, error, isRefetching }` shape
 * that pairs with <AsyncBoundary />.
 */
export function useResource<T>(
  queryKey: QueryKey,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: { enabled?: boolean }
): Resource<T> {
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetcher(signal),
    enabled: options?.enabled,
  })

  return {
    data: query.data,
    status: query.status,
    error: query.error ? toMessage(query.error) : null,
    isFetching: query.isFetching,
    isRefetching: query.isFetching && !query.isPending,
    refetch: () => {
      void query.refetch()
    },
  }
}
