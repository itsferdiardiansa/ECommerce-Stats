import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as inventory from '../index.js'
import { db } from '@/libs/prisma'
import type { CreateInventoryLogInput } from '../index.js'

vi.mock('@/libs/prisma', () => ({
  db: {
    inventoryLog: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Inventory domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createInventoryLog should call db.inventoryLog.create', async () => {
    const mock = { id: 1, productId: 2, delta: -1 }
    // @ts-expect-error mocked
    db.inventoryLog.create.mockResolvedValue(mock)

    const res = await inventory.createInventoryLog({
      product: { connect: { id: 2 } },
      delta: -1,
    } as unknown as CreateInventoryLogInput)
    expect(db.inventoryLog.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('listInventoryLogs returns paginated results and applies filters', async () => {
    const mockData = [{ id: 5, productId: 2 }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.inventoryLog.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.inventoryLog.findMany.mockResolvedValue(mockData)

    const res = await inventory.listInventoryLogs({
      page: 1,
      limit: 10,
      productId: 2,
      reason: 'ADJUSTMENT',
      userId: 3,
    })

    expect(db.inventoryLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: 2,
          reason: 'ADJUSTMENT',
          userId: 3,
        }),
      })
    )
    expect(db.inventoryLog.findMany).toHaveBeenCalledWith(
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

  it('listInventoryLogs default params when no filters provided', async () => {
    const mockData = []
    const mockCount = 0
    // @ts-expect-error mocked
    db.inventoryLog.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.inventoryLog.findMany.mockResolvedValue(mockData)

    const res = await inventory.listInventoryLogs()
    expect(db.inventoryLog.count).toHaveBeenCalled()
    expect(res.meta.page).toBe(1)
    expect(res.meta.limit).toBe(20)
    expect(res.data).toEqual(mockData)
  })
})
