/** Standard cursor-paginated list envelope returned by list endpoints. */
export interface CursorPage<T> {
  items: T[]
  nextCursor: number | null
  total: number
}

/** Build the `?cursor=&limit=` query string for a cursor-paginated request. */
export function cursorQuery(params?: {
  cursor?: number
  limit?: number
}): string {
  const q = new URLSearchParams()
  if (params?.cursor != null) q.set('cursor', String(params.cursor))
  if (params?.limit != null) q.set('limit', String(params.limit))
  const s = q.toString()
  return s ? `?${s}` : ''
}
