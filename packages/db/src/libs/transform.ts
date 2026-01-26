import type { ApiOrder, ApiProduct } from '@/entities/store/types'

export function varyNumber(value: number, pct = 0.05): number {
  const delta = value * pct * (Math.random() * 2 - 1)
  return Math.max(0, Number((value + delta).toFixed(2)))
}

export function transformProduct(product: ApiProduct): ApiProduct {
  const price =
    typeof product.price === 'number'
      ? varyNumber(product.price)
      : product.price
  const rating =
    typeof product.rating === 'number'
      ? Math.min(5, Math.max(0, varyNumber(product.rating, 0.1)))
      : product.rating
  return {
    ...product,
    price,
    rating,
  }
}

export function transformOrder(order: ApiOrder): ApiOrder {
  const items = order.items.map(item => {
    const jitter = Math.round(item.quantity * 0.1 * (Math.random() * 2 - 1))
    const quantity = Math.max(1, item.quantity + jitter)
    return { ...item, quantity }
  })
  return {
    ...order,
    items,
    total_price:
      typeof order.total_price === 'number'
        ? varyNumber(order.total_price, 0.05)
        : order.total_price,
  }
}
