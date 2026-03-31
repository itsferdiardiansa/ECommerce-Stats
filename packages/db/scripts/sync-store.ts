import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import type { ApiOrder, ApiProduct } from '@/entities/store/types'
import { upsertOrder, upsertProduct } from '@/entities/store/sync'
import { transformProduct, transformOrder } from '@/libs/transform'

const API_BASE = (
  process.env.STORE_API_BASE ?? 'https://fake-store-api.mock.beeceptor.com/api'
).replace(/\/$/, '')
const PRODUCTS_URL = `${API_BASE}/products`
const ORDERS_URL = `${API_BASE}/orders`

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  return (await response.json()) as T
}

export async function syncStore() {
  const products = (await fetchJson<ApiProduct[]>(PRODUCTS_URL)).map(
    transformProduct
  )
  for (const product of products) {
    await upsertProduct(product)
  }
  const orders = (await fetchJson<ApiOrder[]>(ORDERS_URL)).map(transformOrder)
  for (const order of orders) {
    await upsertOrder(order)
  }
  console.log('Sync complete!')
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  syncStore().catch(console.error)
}
