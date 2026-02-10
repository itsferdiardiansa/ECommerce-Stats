import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as pricing from '../index.js'
import { db } from '@/libs/prisma'
import type { CreatePriceHistoryInput } from '../index.js'

vi.mock('@/libs/prisma', () => ({
  db: {
    priceHistory: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Pricing domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createPriceHistory should call db.priceHistory.create', async () => {
    const mock = { id: 1, productId: 2, price: { toNumber: () => 100 } }
    // @ts-expect-error mocked
    db.priceHistory.create.mockResolvedValue(mock)

    const res = await pricing.createPriceHistory({
      product: { connect: { id: 2 } },
      price: 100,
    } as unknown as CreatePriceHistoryInput)
    expect(db.priceHistory.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('listPriceHistory returns paginated and filtered results', async () => {
    const mockData = [{ id: 5, productId: 2 }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.priceHistory.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.priceHistory.findMany.mockResolvedValue(mockData)

    const res = await pricing.listPriceHistory({
      page: 1,
      limit: 10,
      productId: 2,
      reason: 'PROMOTION',
    })

    expect(db.priceHistory.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ productId: 2, reason: 'PROMOTION' }),
      })
    )
    expect(db.priceHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ productId: 2 }),
        take: 10,
        skip: 0,
        include: { product: true },
      })
    )
    expect(res).toEqual({
      data: mockData,
      meta: { total: mockCount, page: 1, limit: 10, totalPages: 1 },
    })
  })

  it('listPriceHistory default params and safe limit capping', async () => {
    const mockData = []
    const mockCount = 0
    // @ts-expect-error mocked
    db.priceHistory.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.priceHistory.findMany.mockResolvedValue(mockData)

    const res = await pricing.listPriceHistory({ page: 0, limit: 200 })
    expect(res.meta.page).toBe(1)
    expect(res.meta.limit).toBe(100)
    expect(res.data).toEqual(mockData)
  })
})
