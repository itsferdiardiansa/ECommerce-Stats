import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as wishlist from '../index.js'
import type { CreateWishlistInput, UpdateWishlistInput } from '../index.js'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    wishlist: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    wishlistItem: { create: vi.fn(), delete: vi.fn() },
  },
}))

describe('Sales - wishlist domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createWishlist generates token when missing and isPublic true', async () => {
    let captured: { data: CreateWishlistInput } | null = null
    // @ts-expect-error mocked
    db.wishlist.create.mockImplementationOnce(
      (args: { data: CreateWishlistInput }) => {
        captured = args
        return Promise.resolve({ id: 1, ...args.data })
      }
    )

    const inputPartial: Partial<CreateWishlistInput> = {
      user: { connect: { id: 2 } },
      name: 'My Public List',
      isPublic: true,
    }

    const res = await wishlist.createWishlist(
      inputPartial as CreateWishlistInput
    )

    expect(db.wishlist.create).toHaveBeenCalled()
    const cap = captured as unknown as { data: CreateWishlistInput }
    expect(typeof cap.data.token).toBe('string')
    expect(res.id).toBe(1)
  })

  it('getWishlistById includes items and product images', async () => {
    const mock = { id: 2, items: [{ id: 1, product: { images: [] } }] }
    // @ts-expect-error mocked
    db.wishlist.findUnique.mockResolvedValue(mock)

    const res = await wishlist.getWishlistById(2)
    expect(db.wishlist.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 }, include: expect.any(Object) })
    )
    expect(res).toEqual(mock)
  })

  it('getWishlistByToken includes items', async () => {
    const mock = { id: 3, token: 'tok-1', items: [] }
    // @ts-expect-error mocked
    db.wishlist.findUnique.mockResolvedValue(mock)

    const res = await wishlist.getWishlistByToken('tok-1')
    expect(db.wishlist.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token: 'tok-1' } })
    )
    expect(res).toEqual(mock)
  })

  it('updateWishlist and deleteWishlist forward to db', async () => {
    const updated = { id: 4 }
    const deleted = { id: 5 }
    // @ts-expect-error mocked
    db.wishlist.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.wishlist.delete.mockResolvedValue(deleted)

    const up = await wishlist.updateWishlist(4, {
      name: 'Updated',
    } as UpdateWishlistInput)
    expect(db.wishlist.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { name: 'Updated' },
    })
    expect(up).toEqual(updated)

    const d = await wishlist.deleteWishlist(5)
    expect(db.wishlist.delete).toHaveBeenCalledWith({ where: { id: 5 } })
    expect(d).toEqual(deleted)
  })

  it('addItemToWishlist and removeItemFromWishlist operate on wishlistItem', async () => {
    const created = { id: 6 }
    const removed = { id: 7 }
    // @ts-expect-error mocked
    db.wishlistItem.create.mockResolvedValue(created)
    // @ts-expect-error mocked
    db.wishlistItem.delete.mockResolvedValue(removed)

    const c = await wishlist.addItemToWishlist(10, 20, 'Nice product')
    expect(db.wishlistItem.create).toHaveBeenCalledWith({
      data: { wishlistId: 10, productId: 20, note: 'Nice product' },
    })
    expect(c).toEqual(created)

    const r = await wishlist.removeItemFromWishlist(10, 20)
    expect(db.wishlistItem.delete).toHaveBeenCalledWith({
      where: { wishlistId_productId: { wishlistId: 10, productId: 20 } },
    })
    expect(r).toEqual(removed)
  })

  it('listWishlists supports filters and caps pagination', async () => {
    const mockData = [{ id: 8 }]
    // @ts-expect-error mocked
    db.wishlist.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.wishlist.findMany.mockResolvedValue(mockData)

    const res = await wishlist.listWishlists({
      page: 0,
      limit: 200,
      userId: 42,
      isPublic: true,
      search: 'My',
    })

    expect(db.wishlist.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 42, isPublic: true }),
      })
    )
    expect(db.wishlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ name: expect.any(Object) }),
        take: 100,
        skip: 0,
      })
    )
    expect(res.meta.limit).toBe(100)
    expect(res.data).toEqual(mockData)
  })

  it('listWishlists default params with no filters', async () => {
    const mockData: Array<{ id: number }> = []
    // @ts-expect-error mocked
    db.wishlist.count.mockResolvedValue(0)
    // @ts-expect-error mocked
    db.wishlist.findMany.mockResolvedValue(mockData)

    const res = await wishlist.listWishlists()
    expect(db.wishlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10, where: expect.any(Object) })
    )
    expect(res.meta.limit).toBe(10)
    expect(res.data).toEqual(mockData)
  })
})
