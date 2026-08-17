import { QueryClient } from '@tanstack/react-query'

/** A QueryClient with defaults tuned for admin dashboards. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}
