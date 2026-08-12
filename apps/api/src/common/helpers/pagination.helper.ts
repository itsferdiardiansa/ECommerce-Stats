export interface CursorPage<T> {
  items: T[]
  nextCursor: number | null
  total: number
}

/** Clamp a caller-supplied page size into a safe range. */
export function clampLimit(limit: number | undefined, def = 20, max = 50) {
  return Math.min(Math.max(limit ?? def, 1), max)
}

/**
 * Given rows fetched with `take: limit + 1`, split off the extra row and derive
 * the next cursor from the last kept row's id.
 */
export function sliceCursor<T extends { id: number }>(
  rows: T[],
  limit: number
) {
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  return {
    page,
    nextCursor: hasMore && page.length ? page[page.length - 1].id : null,
  }
}
