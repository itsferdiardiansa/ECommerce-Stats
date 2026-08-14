'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { CursorPage } from '@/lib/pagination'

/** Reusable infinite-scroll query for any cursor-paginated list endpoint. */
export function useCursorInfinite<T>(
  queryKey: readonly unknown[],
  fetcher: (params: {
    cursor?: number
    limit?: number
  }) => Promise<CursorPage<T>>,
  options?: { limit?: number; enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetcher({ cursor: pageParam ?? undefined, limit: options?.limit }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    enabled: options?.enabled ?? true,
  })
}
