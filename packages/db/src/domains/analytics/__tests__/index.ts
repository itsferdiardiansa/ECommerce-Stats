import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as analytics from '..'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      findManyTop: vi.fn(),
      findManyByPrice: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    productReview: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}))

describe('Analytics domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getLastSync returns date when present', async () => {
    // @ts-expect-error mocked
    db.product.findFirst.mockResolvedValue({ syncedAt: new Date('2024-01-01') })

    const res = await analytics.getLastSync()
    expect(res).toEqual(new Date('2024-01-01'))
  })

  it('getLastSync returns Unknown when none', async () => {
    // @ts-expect-error mocked
    db.product.findFirst.mockResolvedValue(null)

    const res = await analytics.getLastSync()
    expect(res).toBe('Unknown')
  })

  it('getTotalRevenue sums order items', async () => {
    // Mock unitPrice with toNumber
    const items = [
      { unitPrice: { toNumber: () => 10 }, quantity: 2 },
      { unitPrice: { toNumber: () => 5 }, quantity: 3 },
    ]
    // @ts-expect-error mocked
    db.orderItem.findMany.mockResolvedValue(items)

    const res = await analytics.getTotalRevenue()
    expect(res).toBe(10 * 2 + 5 * 3)
  })

  it('getTotalOrderCount calls count', async () => {
    // @ts-expect-error mocked
    db.order.count.mockResolvedValue(7)

    const res = await analytics.getTotalOrderCount()
    expect(res).toBe(7)
  })

  it('getAverageOrderValue returns average from aggregate', async () => {
    // @ts-expect-error mocked
    db.order.aggregate.mockResolvedValue({
      _avg: { grandTotal: { toNumber: () => 42 } },
    })

    const res = await analytics.getAverageOrderValue()
    expect(res).toBe(42)
  })

  it('getAverageProductRating without productId', async () => {
    // @ts-expect-error mocked
    db.productReview.aggregate.mockResolvedValue({ _avg: { rating: 4 } })

    const res = await analytics.getAverageProductRating()
    expect(res).toBe(4)
  })

  it('getOrderCountByStatus returns mapped results', async () => {
    const groups = [{ status: 'COMPLETED', _count: { _all: 3 } }]
    // @ts-expect-error mocked
    db.order.groupBy.mockResolvedValue(groups)

    const res = await analytics.getOrderCountByStatus()
    expect(res).toEqual([{ status: 'COMPLETED', count: 3 }])
  })

  it('getProductCountByCategory maps categories', async () => {
    const productGroups = [
      { categoryId: 1, _count: { _all: 5 } },
      { categoryId: null, _count: { _all: 2 } },
    ]
    const categories = [{ id: 1, name: 'Books' }]
    // @ts-expect-error mocked
    db.product.groupBy.mockResolvedValue(productGroups)
    // @ts-expect-error mocked
    db.category.findMany.mockResolvedValue(categories)

    const res = await analytics.getProductCountByCategory()
    expect(res).toEqual([
      { categoryId: 1, categoryName: 'Books', category: 'Books', count: 5 },
      {
        categoryId: null,
        categoryName: null,
        category: 'Uncategorized',
        count: 2,
      },
    ])
  })

  it('getProductCountByCategory handles category not found (Uncategorized)', async () => {
    const productGroups = [{ categoryId: 99, _count: { _all: 2 } }]
    // categories empty -> categoryName should be null and labeled 'Uncategorized'
    // @ts-expect-error mocked
    db.product.groupBy.mockResolvedValue(productGroups)
    // @ts-expect-error mocked
    db.category.findMany.mockResolvedValue([])

    const res = await analytics.getProductCountByCategory()
    expect(res).toEqual([
      {
        categoryId: 99,
        categoryName: null,
        category: 'Uncategorized',
        count: 2,
      },
    ])
  })

  it('getRevenueByCategory returns empty array when no items', async () => {
    // @ts-expect-error mocked
    db.orderItem.findMany.mockResolvedValue([])
    const res = await analytics.getRevenueByCategory()
    expect(res).toEqual([])
  })

  it('getAverageOrderValue returns 0 when avg is null', async () => {
    // @ts-expect-error mocked
    db.order.aggregate.mockResolvedValue({ _avg: { grandTotal: null } })
    const res = await analytics.getAverageOrderValue()
    expect(res).toBe(0)
  })

  it('getAverageProductRating without productId returns 0 when avg null', async () => {
    // @ts-expect-error mocked
    db.productReview.aggregate.mockResolvedValue({ _avg: { rating: null } })
    const res = await analytics.getAverageProductRating()
    expect(res).toBe(0)
  })

  it('getRevenueByCategory handles undefined quantity as zero', async () => {
    const orderItems = [
      {
        unitPrice: { toNumber: () => 10 },
        quantity: undefined,
        product: { category: null },
      },
      {
        unitPrice: { toNumber: () => 5 },
        quantity: 2,
        product: { category: { name: 'B' } },
      },
    ]
    // @ts-expect-error mocked
    db.orderItem.findMany.mockResolvedValue(orderItems)

    const res = await analytics.getRevenueByCategory()
    expect(res).toEqual(
      expect.arrayContaining([
        { category: 'B', revenue: 10 },
        { category: 'Uncategorized', revenue: 0 },
      ])
    )
  })

  it('getOrderValueByStatus returns 0 when avg grandTotal is null', async () => {
    const groups = [{ status: 'PENDING', _avg: { grandTotal: null } }]
    // @ts-expect-error mocked
    db.order.groupBy.mockResolvedValue(groups)
    const res = await analytics.getOrderValueByStatus()
    expect(res).toEqual([{ status: 'PENDING', avgValue: 0 }])
  })

  it('getRevenueByCategory aggregates revenue', async () => {
    const orderItems = [
      {
        unitPrice: { toNumber: () => 10 },
        quantity: 1,
        product: { category: { name: 'A' } },
      },
      {
        unitPrice: { toNumber: () => 5 },
        quantity: 2,
        product: { category: null },
      },
    ]
    // @ts-expect-error mocked
    db.orderItem.findMany.mockResolvedValue(orderItems)

    const res = await analytics.getRevenueByCategory()
    expect(res).toEqual(
      expect.arrayContaining([
        { category: 'A', revenue: 10 },
        { category: 'Uncategorized', revenue: 10 },
      ])
    )
  })

  it('getRecentOrders returns orders', async () => {
    const orders = [{ id: 1 }, { id: 2 }]
    // @ts-expect-error mocked
    db.order.findMany.mockResolvedValue(orders)

    const res = await analytics.getRecentOrders(2)
    expect(res).toEqual(orders)
  })

  it('getTopProductsByPrice returns products', async () => {
    const products = [{ id: 1, price: { toNumber: () => 100 } }]
    // @ts-expect-error mocked
    db.product.findMany.mockResolvedValue(products)

    const res = await analytics.getTopProductsByPrice(1)
    expect(res).toEqual(products)
  })

  it('getOrderValueByStatus returns avg values', async () => {
    const groups = [
      { status: 'COMPLETED', _avg: { grandTotal: { toNumber: () => 77 } } },
    ]
    // @ts-expect-error mocked
    db.order.groupBy.mockResolvedValue(groups)

    const res = await analytics.getOrderValueByStatus()
    expect(res).toEqual([{ status: 'COMPLETED', avgValue: 77 }])
  })

  it('getProductRatingDistribution returns distribution', async () => {
    const groups = [{ rating: 5, _count: { _all: 8 } }]
    // @ts-expect-error mocked
    db.productReview.groupBy.mockResolvedValue(groups)

    const res = await analytics.getProductRatingDistribution()
    expect(res).toEqual([{ rating: 5, count: 8 }])
  })

  it('getTotalRevenue returns 0 for empty items', async () => {
    // @ts-expect-error mocked
    db.orderItem.findMany.mockResolvedValue([])

    const res = await analytics.getTotalRevenue()
    expect(res).toBe(0)
  })

  it('getAverageProductRating returns 0 when avg is null for productId', async () => {
    // @ts-expect-error mocked
    db.productReview.aggregate.mockResolvedValue({ _avg: { rating: null } })

    const res = await analytics.getAverageProductRating(123)
    expect(res).toBe(0)
  })
})
