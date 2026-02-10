import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as review from '../index.js'
import { db } from '@/libs/prisma'
import type { CreateReviewInput, UpdateReviewInput } from '../index.js'

vi.mock('@/libs/prisma', () => ({
  db: {
    productReview: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Review domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createReview should call db.productReview.create', async () => {
    const mock = { id: 1, rating: 5 }
    // @ts-expect-error mocked
    db.productReview.create.mockResolvedValue(mock)

    const res = await review.createReview({
      rating: 5,
      product: { connect: { id: 2 } },
      user: { connect: { id: 3 } },
    } as CreateReviewInput)
    expect(db.productReview.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getReviewById includes user and product selects', async () => {
    const mock = { id: 2 }
    // @ts-expect-error mocked
    db.productReview.findUnique.mockResolvedValue(mock)

    const res = await review.getReviewById(2)
    expect(db.productReview.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    })
    expect(res).toEqual(mock)
  })

  it('update and delete forward to db', async () => {
    const updated = { id: 3 }
    const deleted = { id: 4 }
    // @ts-expect-error mocked
    db.productReview.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.productReview.delete.mockResolvedValue(deleted)

    const up = await review.updateReview(3, { rating: 4 } as UpdateReviewInput)
    expect(db.productReview.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { rating: 4 },
    })
    expect(up).toEqual(updated)

    const d = await review.deleteReview(4)
    expect(db.productReview.delete).toHaveBeenCalledWith({ where: { id: 4 } })
    expect(d).toEqual(deleted)
  })

  it('listReviews supports filters and search', async () => {
    const mockData = [{ id: 5 }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.productReview.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.productReview.findMany.mockResolvedValue(mockData)

    const res = await review.listReviews({
      page: 1,
      limit: 10,
      minRating: 3,
      isPublished: true,
      productId: 2,
      userId: 3,
      search: 'good',
    })
    expect(db.productReview.count).toHaveBeenCalled()
    expect(db.productReview.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })

  it('listReviews default params no filters', async () => {
    const mockData = []
    const mockCount = 0
    // @ts-expect-error mocked
    db.productReview.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.productReview.findMany.mockResolvedValue(mockData)

    const res = await review.listReviews()
    expect(db.productReview.count).toHaveBeenCalled()
    expect(res.meta.page).toBe(1)
    expect(res.meta.limit).toBe(20)
    expect(res.data).toEqual(mockData)
  })
})
