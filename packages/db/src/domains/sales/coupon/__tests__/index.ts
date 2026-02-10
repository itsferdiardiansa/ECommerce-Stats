import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as coupon from '../index.js'
import type { CreateCouponInput, UpdateCouponInput } from '../index.js'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    coupon: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Sales - coupon domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createCoupon forwards full create input to db.create', async () => {
    let captured: { data: CreateCouponInput } | null = null
    // @ts-expect-error mocked
    db.coupon.create.mockImplementationOnce(
      (args: { data: CreateCouponInput }) => {
        captured = args
        return Promise.resolve({ id: 1, ...args.data })
      }
    )

    const inputPartial: Partial<CreateCouponInput> = {
      code: 'SPRING10',
      description: 'Spring sale 10% off all items',
      discountType: 'PERCENT',
      discountValue: 10,
      minSpend: 20,
      maxDiscount: 50,
      usageLimit: 100,
      usageCount: 0,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-04-01T00:00:00.000Z'),
      isActive: true,
    }

    const res = await coupon.createCoupon(inputPartial as CreateCouponInput)

    expect(db.coupon.create).toHaveBeenCalled()
    expect(captured).toBeTruthy()
    const cap = captured as unknown as { data: CreateCouponInput }
    expect(cap.data.code).toBe('SPRING10')
    expect(cap.data.discountType).toBe('PERCENT')
    expect(res.id).toBe(1)
  })

  it('getCouponById calls findUnique with id', async () => {
    const mock = { id: 2, code: 'SUMMER' }
    // @ts-expect-error mocked
    db.coupon.findUnique.mockResolvedValue(mock)

    const res = await coupon.getCouponById(2)
    expect(db.coupon.findUnique).toHaveBeenCalledWith({ where: { id: 2 } })
    expect(res).toEqual(mock)
  })

  it('getCouponByCode calls findUnique with code', async () => {
    const mock = { id: 3, code: 'WELCOME' }
    // @ts-expect-error mocked
    db.coupon.findUnique.mockResolvedValue(mock)

    const res = await coupon.getCouponByCode('WELCOME')
    expect(db.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: 'WELCOME' },
    })
    expect(res).toEqual(mock)
  })

  it('updateCoupon forwards update input', async () => {
    const updated = { id: 4, isActive: false }
    // @ts-expect-error mocked
    db.coupon.update.mockResolvedValue(updated)

    const updateInput: UpdateCouponInput = {
      description: 'Expired',
      isActive: false,
    }
    const res = await coupon.updateCoupon(4, updateInput)
    expect(db.coupon.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: updateInput,
    })
    expect(res).toEqual(updated)
  })

  it('deleteCoupon forwards to db.delete', async () => {
    const deleted = { id: 5 }
    // @ts-expect-error mocked
    db.coupon.delete.mockResolvedValue(deleted)

    const res = await coupon.deleteCoupon(5)
    expect(db.coupon.delete).toHaveBeenCalledWith({ where: { id: 5 } })
    expect(res).toEqual(deleted)
  })

  it('listCoupons supports filters, search OR and caps pagination', async () => {
    const mockData = [{ id: 6, code: 'SPRING10' }]
    // @ts-expect-error mocked
    db.coupon.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.coupon.findMany.mockResolvedValue(mockData)

    const res = await coupon.listCoupons({
      page: 0,
      limit: 200,
      code: 'SPRING10',
      isActive: true,
      discountType: 'PERCENT',
      search: 'spring',
    })

    expect(db.coupon.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          discountType: 'PERCENT',
        }),
      })
    )
    expect(db.coupon.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
        take: 100,
        skip: 0,
      })
    )
    expect(res.meta.limit).toBe(100)
    expect(res.data).toEqual(mockData)
  })

  it('listCoupons default params with no filters', async () => {
    const mockData: Array<{ id: number; code?: string }> = []
    // @ts-expect-error mocked
    db.coupon.count.mockResolvedValue(0)
    // @ts-expect-error mocked
    db.coupon.findMany.mockResolvedValue(mockData)

    const res = await coupon.listCoupons()
    expect(db.coupon.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, where: expect.any(Object) })
    )
    expect(res.meta.limit).toBe(20)
    expect(res.data).toEqual(mockData)
  })
})
