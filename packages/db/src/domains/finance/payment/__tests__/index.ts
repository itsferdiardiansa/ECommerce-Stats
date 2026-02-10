import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as payment from '../index.js'
import type { CreatePaymentInput, UpdatePaymentInput } from '../index.js'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Finance - payment domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createPayment calls db.create', async () => {
    const input: CreatePaymentInput = {
      amount: 100,
      currency: 'USD',
      provider: 'stripe',
      transactionId: 'tx-123',
      status: 'succeeded',
      order: { connect: { id: 1 } },
    }
    const mock = { id: 1, ...input }
    // @ts-expect-error mocked
    db.payment.create.mockResolvedValue(mock)

    const res = await payment.createPayment(input)
    expect(db.payment.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getPaymentById includes order', async () => {
    const mock = { id: 2, order: { id: 10 } }
    // @ts-expect-error mocked
    db.payment.findUnique.mockResolvedValue(mock)

    const res = await payment.getPaymentById(2)
    expect(db.payment.findUnique).toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(res!.order).toBeDefined()
  })

  it('getPaymentByTransactionId calls findUnique', async () => {
    const mock = { id: 3 }
    // @ts-expect-error mocked
    db.payment.findUnique.mockResolvedValue(mock)

    const res = await payment.getPaymentByTransactionId('tx-1')
    expect(db.payment.findUnique).toHaveBeenCalledWith({
      where: { transactionId: 'tx-1' },
    })
    expect(res).toEqual(mock)
  })

  it('listPayments returns paginated data', async () => {
    const mockData = [{ id: 1 }]
    // @ts-expect-error mocked
    db.payment.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.payment.findMany.mockResolvedValue(mockData)

    const res = await payment.listPayments({ page: 1, limit: 10 })
    expect(res.data).toEqual(mockData)
    expect(res.meta.total).toBe(1)
  })

  it('listPayments handles filters and pagination bounds', async () => {
    const mockData = [{ id: 5 }]
    // @ts-expect-error mocked
    db.payment.count.mockResolvedValue(2)
    // @ts-expect-error mocked
    db.payment.findMany.mockResolvedValue(mockData)

    const res = await payment.listPayments({
      page: 0,
      limit: 200,
      provider: 'stripe',
      status: 'succeeded',
      orderId: 10,
    })
    expect(res.meta.limit).toBe(100)
    expect(db.payment.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })

  it('updatePayment calls update', async () => {
    const mock = { id: 7, status: 'refunded' }
    // @ts-expect-error mocked
    db.payment.update.mockResolvedValue(mock)

    const res = await payment.updatePayment(7, {
      status: 'refunded',
    } as UpdatePaymentInput)
    expect(db.payment.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: 'refunded' },
    })
    expect(res).toEqual(mock)
  })
})
