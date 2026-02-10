import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as cart from '../index.js'
import type { CreateCartInput, UpdateCartInput } from '../index.js'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    cart: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Cart domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createCart generates token when missing and calls create', async () => {
    let captured: {
      data: CreateCartInput
    } | null = null
    // @ts-expect-error mocked
    db.cart.create.mockImplementationOnce(args => {
      captured = args
      return Promise.resolve({ id: 1, ...args.data })
    })

    const inputPartial: Partial<CreateCartInput> = {
      user: { connect: { id: 2 } },
      items: { create: [{ product: { connect: { id: 3 } }, quantity: 2 }] },
      currency: 'USD',
    }
    const res = await cart.createCart(inputPartial as CreateCartInput)

    expect(db.cart.create).toHaveBeenCalled()
    expect(captured).not.toBeNull()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(typeof captured!.data.token).toBe('string')
    expect(res.id).toBe(1)
  })

  it('getCartById includes items with product images and variant', async () => {
    const mock = {
      id: 2,
      items: [{ id: 1, product: { images: [] }, variant: null }],
    }
    // @ts-expect-error mocked
    db.cart.findUnique.mockResolvedValue(mock)

    const res = await cart.getCartById(2)
    expect(db.cart.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 }, include: expect.any(Object) })
    )
    expect(res).toEqual(mock)
  })

  it('getCartByToken includes items', async () => {
    const mock = { id: 3, token: 'abc', items: [] }
    // @ts-expect-error mocked
    db.cart.findUnique.mockResolvedValue(mock)

    const res = await cart.getCartByToken('abc')
    expect(db.cart.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token: 'abc' } })
    )
    expect(res).toEqual(mock)
  })

  it('updateCart and deleteCart forward to db', async () => {
    const updated = { id: 4 }
    const deleted = { id: 5 }
    // @ts-expect-error mocked
    db.cart.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.cart.delete.mockResolvedValue(deleted)

    const up = await cart.updateCart(4, { status: 'ACTIVE' } as UpdateCartInput)
    expect(db.cart.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { status: 'ACTIVE' },
    })
    expect(up).toEqual(updated)

    const d = await cart.deleteCart(5)
    expect(db.cart.delete).toHaveBeenCalledWith({ where: { id: 5 } })
    expect(d).toEqual(deleted)
  })

  it('listCarts supports filters and caps pagination', async () => {
    const mockData = [{ id: 6 }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.cart.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.cart.findMany.mockResolvedValue(mockData)

    const res = await cart.listCarts({
      page: 0,
      limit: 200,
      userId: 10,
      status: 'OPEN',
    })
    expect(db.cart.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 10, status: 'OPEN' }),
      })
    )
    expect(db.cart.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 10 }),
        take: 100,
        skip: 0,
        include: { _count: { select: { items: true } } },
      })
    )
    expect(res.meta.page).toBe(1)
    expect(res.meta.limit).toBe(100)
    expect(res.data).toEqual(mockData)
  })

  it('createCart preserves token when provided', async () => {
    let captured: {
      data: CreateCartInput
    } | null = null
    // @ts-expect-error mocked
    db.cart.create.mockImplementationOnce(args => {
      captured = args
      return Promise.resolve({ id: 10, ...args.data })
    })

    const input: CreateCartInput = {
      token: 'provided-token',
      user: { connect: { id: 2 } },
      items: { create: [{ product: { connect: { id: 4 } }, quantity: 1 }] },
    }
    const res = await cart.createCart(input)

    expect(db.cart.create).toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(captured!.data.token).toBe('provided-token')
    expect(res.id).toBe(10)
  })

  it('listCarts default params with no filters', async () => {
    const mockData = []
    const mockCount = 0
    // @ts-expect-error mocked
    db.cart.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.cart.findMany.mockResolvedValue(mockData)

    const res = await cart.listCarts()
    expect(db.cart.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, where: expect.any(Object) })
    )
    expect(res.meta.page).toBe(1)
    expect(res.meta.limit).toBe(20)
    expect(res.data).toEqual(mockData)
  })
})
