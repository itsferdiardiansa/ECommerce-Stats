import {
  getLastSync,
  getTotalRevenue,
  getTotalOrderCount,
  getAverageOrderValue,
  getAverageProductRating,
  getOrderCountByStatus,
  getProductCountByCategory,
  getRevenueByCategory,
  getRecentOrders,
  getTopProductsByPrice,
} from '@rufieltics/db'

export const CACHE_TTL = 3600

export const CACHE_KEYS = {
  LAST_SYNC: ['analytics', 'last-sync'] as const,
  TOTAL_REVENUE: ['analytics', 'total-revenue'] as const,
  TOTAL_ORDER_COUNT: ['analytics', 'total-order-count'] as const,
  AVERAGE_ORDER_VALUE: ['analytics', 'average-order-value'] as const,
  AVERAGE_PRODUCT_RATING: ['analytics', 'average-product-rating'] as const,
  ORDER_COUNT_BY_STATUS: ['analytics', 'order-count-by-status'] as const,
  PRODUCT_COUNT_BY_CATEGORY: [
    'analytics',
    'product-count-by-category',
  ] as const,
  REVENUE_BY_CATEGORY: ['analytics', 'revenue-by-category'] as const,
  RECENT_ORDERS: ['analytics', 'recent-orders'] as const,
  TOP_PRODUCTS_BY_PRICE: ['analytics', 'top-products-by-price'] as const,
} as const

type CacheEntry<T> = { value: T; expiresAt: number }
const cache = new Map<string, CacheEntry<unknown>>()

function makeCacheKey(parts: readonly string[]) {
  return parts.join(':')
}

function isExpired(entry: CacheEntry<unknown>) {
  return Date.now() > entry.expiresAt
}

async function getOrSetCached<T>(
  keyParts: readonly string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: (...args: any[]) => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = []
): Promise<T> {
  const key = makeCacheKey([...keyParts, ...args.map(String)])

  const existing = cache.get(key) as CacheEntry<T> | undefined
  if (existing && !isExpired(existing)) {
    console.info(`[analytics] cache hit: ${key}`)
    return existing.value
  }

  console.info(`[analytics] cache miss: ${key}`)
  const value = await fetcher(...args)
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL * 1000 })
  return value
}

export function clearAnalyticsCache() {
  cache.clear()
}

export function getCachedLastSync() {
  return getOrSetCached(CACHE_KEYS.LAST_SYNC, getLastSync)
}

export function getCachedTotalRevenue() {
  return getOrSetCached(CACHE_KEYS.TOTAL_REVENUE, getTotalRevenue)
}

export function getCachedTotalOrderCount() {
  return getOrSetCached(CACHE_KEYS.TOTAL_ORDER_COUNT, getTotalOrderCount)
}

export function getCachedAverageOrderValue() {
  return getOrSetCached(CACHE_KEYS.AVERAGE_ORDER_VALUE, getAverageOrderValue)
}

export function getCachedAverageProductRating(productId?: number) {
  return getOrSetCached(
    CACHE_KEYS.AVERAGE_PRODUCT_RATING,
    getAverageProductRating,
    productId !== undefined ? [productId] : []
  )
}

export function getCachedOrderCountByStatus() {
  return getOrSetCached(CACHE_KEYS.ORDER_COUNT_BY_STATUS, getOrderCountByStatus)
}

export function getCachedProductCountByCategory() {
  return getOrSetCached(
    CACHE_KEYS.PRODUCT_COUNT_BY_CATEGORY,
    getProductCountByCategory
  )
}

export function getCachedRevenueByCategory() {
  return getOrSetCached(CACHE_KEYS.REVENUE_BY_CATEGORY, getRevenueByCategory)
}

export function getCachedRecentOrders(limit = 5) {
  return getOrSetCached(CACHE_KEYS.RECENT_ORDERS, getRecentOrders, [limit])
}

export function getCachedTopProductsByPrice(limit = 5) {
  return getOrSetCached(
    CACHE_KEYS.TOP_PRODUCTS_BY_PRICE,
    getTopProductsByPrice,
    [limit]
  )
}
