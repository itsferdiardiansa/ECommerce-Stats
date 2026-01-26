import 'dotenv/config'
import { schedules, task, logger } from '@trigger.dev/sdk'
import fetch from 'node-fetch'
import {
  db,
  upsertOrder,
  upsertProduct,
  transformOrder,
  transformProduct,
  type ApiOrder,
  type ApiProduct,
} from '@rufieltics/db'

const API_BASE = (process.env.STORE_API_BASE ?? '').replace(/\/$/, '')
const PRODUCTS_URL = `${API_BASE}/products`
const ORDERS_URL = `${API_BASE}/orders`
const SYNC_CONCURRENCY = Math.max(
  1,
  Number(process.env.STORE_SYNC_CONCURRENCY ?? '5')
)

async function acquireAdvisoryLock(lockKey: number) {
  const [row] = await db.$queryRaw<Array<{ pg_try_advisory_lock: boolean }>>`
    select pg_try_advisory_lock(${lockKey})
  `
  return row?.pg_try_advisory_lock ?? false
}

async function releaseAdvisoryLock(lockKey: number) {
  await db.$queryRaw`select pg_advisory_unlock(${lockKey})`
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>
) {
  if (!items.length) return
  let index = 0
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const current = index++
        if (current >= items.length) break
        await worker(items[current], current)
      }
    }
  )
  await Promise.all(runners)
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Fetch failed for ${url}: ${response.status}`)
  return (await response.json()) as T
}

async function runSyncStore() {
  const lockKey = 20250126
  const started = Date.now()
  logger.info(`[sync-store] start`, {
    PRODUCTS_URL,
    ORDERS_URL,
    concurrency: SYNC_CONCURRENCY,
  })
  const locked = await acquireAdvisoryLock(lockKey)
  if (!locked) {
    logger.warn(`[sync-store] skipped; lock is held`)
    return { ok: false, skipped: true, reason: 'lock-held' as const }
  }

  try {
    const [rawProducts, rawOrders] = await Promise.all([
      fetcher<ApiProduct[]>(PRODUCTS_URL),
      fetcher<ApiOrder[]>(ORDERS_URL),
    ])
    const products = rawProducts.map(transformProduct)
    const orders = rawOrders.map(transformOrder)

    await runWithConcurrency(products, SYNC_CONCURRENCY, async product => {
      await upsertProduct(product)
    })
    logger.info(`[sync-store] products upserted`, { count: products.length })

    await runWithConcurrency(orders, SYNC_CONCURRENCY, async order => {
      await upsertOrder(order)
    })
    logger.info(`[sync-store] orders upserted`, { count: orders.length })

    const elapsedMs = Date.now() - started
    logger.info(`[sync-store] success`, { elapsedMs })
    return {
      ok: true,
      products: products.length,
      orders: orders.length,
      elapsedMs,
    }
  } catch (error) {
    const elapsedMs = Date.now() - started
    logger.error(`[sync-store] error`, { error, elapsedMs })
    throw error
  } finally {
    await releaseAdvisoryLock(lockKey)
  }
}

export const syncStoreTask = task({
  id: 'sync-store-task',
  run: async () => runSyncStore(),
})

export const scheduledSyncStore = schedules.task({
  id: 'scheduled-sync-store',
  cron: {
    pattern: '0 * * * *',
    timezone: 'Asia/Jakarta',
    environments: ['DEVELOPMENT', 'PRODUCTION'],
  },
  run: async () => runSyncStore(),
})

export { runSyncStore }
