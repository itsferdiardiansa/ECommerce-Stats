import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as order from '../index.js'
import type { CreateOrderInput, UpdateOrderInput } from '../index.js'
import { OrderStatus } from '@prisma/generated'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Sales - order domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createOrder generates orderNumber when missing and calls create', async () => {
    let captured: { data: CreateOrderInput } | null = null
    // @ts-expect-error mocked
    db.order.create.mockImplementationOnce(
      (args: { data: CreateOrderInput }) => {
        captured = args
        return Promise.resolve({ id: 1, ...args.data })
      }
    )

    const inputPartial: Partial<CreateOrderInput> = {
      user: { connect: { id: 2 } },
      items: {
        create: [
          {
            productId: 3,
            sku: 'SKU-3',
            name: 'Product 3',
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
          },
        ],
      },
      subtotal: 200,
      taxTotal: 10,
      shippingTotal: 5,
      grandTotal: 215,
      currency: 'USD',
      status: OrderStatus.Pending,
    }

    const res = await order.createOrder(inputPartial as CreateOrderInput)

    expect(db.order.create).toHaveBeenCalled()
    expect(captured).toBeTruthy()
    const cap = captured as unknown as { data: CreateOrderInput }
    expect(typeof cap.data.orderNumber).toBe('string')
    expect(res.id).toBe(1)
  })

  it('getOrderById includes items, user and shippingAddress', async () => {
    const mock = {
      id: 2,
      items: [{ id: 1, product: { id: 3 } }],
      user: { id: 4 },
      shippingAddress: { id: 5 },
    }
    // @ts-expect-error mocked
    db.order.findUnique.mockResolvedValue(mock)

    const res = await order.getOrderById(2)
    expect(db.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 }, include: expect.any(Object) })
    )
    expect(res).toEqual(mock)
  })

  it('updateOrder forwards update input', async () => {
    const updated = { id: 4, status: OrderStatus.Processing }
    // @ts-expect-error mocked
    db.order.update.mockResolvedValue(updated)

    const updateInput: UpdateOrderInput = { status: OrderStatus.Processing }
    const res = await order.updateOrder(4, updateInput)
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: updateInput,
    })
    expect(res).toEqual(updated)
  })

  it('deleteOrder forwards to db.delete', async () => {
    const deleted = { id: 5 }
    // @ts-expect-error mocked
    db.order.delete.mockResolvedValue(deleted)

    const res = await order.deleteOrder(5)
    expect(db.order.delete).toHaveBeenCalledWith({ where: { id: 5 } })
    expect(res).toEqual(deleted)
  })

  it('listOrders supports filters, search OR and caps pagination', async () => {
    const mockData = [{ id: 6, orderNumber: 'ORD-1' }]
    // @ts-expect-error mocked
    db.order.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.order.findMany.mockResolvedValue(mockData)

    const res = await order.listOrders({
      page: 0,
      limit: 200,
      status: OrderStatus.Processing,
      userId: 10,
      minTotal: 100,
      maxTotal: 1000,
      search: 'ORD-',
    })

    expect(db.order.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 10 }),
      })
    )
    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
        take: 100,
        skip: 0,
        include: { user: true, items: true },
      })
    )
    expect(res.meta.limit).toBe(100)
    expect(res.data).toEqual(mockData)
  })

  it('listOrders default params with no filters', async () => {
    const mockData: Array<{ id: number; orderNumber?: string }> = []
    // @ts-expect-error mocked
    db.order.count.mockResolvedValue(0)
    // @ts-expect-error mocked
    db.order.findMany.mockResolvedValue(mockData)

    const res = await order.listOrders()
    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10, where: expect.any(Object) })
    )
    expect(res.meta.limit).toBe(10)
    expect(res.data).toEqual(mockData)
  })

  it('listOrders handles fromDate and toDate filters', async () => {
    const mockData = [{ id: 7, orderNumber: 'ORD-2' }]
    // @ts-expect-error mocked
    db.order.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.order.findMany.mockResolvedValue(mockData)

    const res = await order.listOrders({
      fromDate: '2026-01-01',
      toDate: '2026-02-01',
    })

    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    )
    expect(res.data).toEqual(mockData)
  })
})
