import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as shipment from '../index.js'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    shipment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Shipment domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createShipment calls create', async () => {
    const input = {
      trackingNumber: 'TRACK123',
      carrier: 'UPS',
      status: 'pending',
      order: { connect: { id: 1 } },
    }
    const mock = { id: 1, ...input }
    // @ts-expect-error mocked
    db.shipment.create.mockResolvedValue(mock)

    const res = await shipment.createShipment(input)
    expect(db.shipment.create).toHaveBeenCalledWith({ data: input })
    expect(res).toEqual(mock)
  })

  it('getShipmentById includes order', async () => {
    const mock = { id: 2 }
    // @ts-expect-error mocked
    db.shipment.findUnique.mockResolvedValue(mock)

    const res = await shipment.getShipmentById(2)
    expect(db.shipment.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      include: { order: true },
    })
    expect(res).toEqual(mock)
  })

  it('getShipmentByTrackingNumber calls findFirst', async () => {
    const mock = { id: 3 }
    // @ts-expect-error mocked
    db.shipment.findFirst.mockResolvedValue(mock)

    const res = await shipment.getShipmentByTrackingNumber('TRACK123')
    expect(db.shipment.findFirst).toHaveBeenCalledWith({
      where: { trackingNumber: 'TRACK123' },
    })
    expect(res).toEqual(mock)
  })

  it('updateShipment calls update', async () => {
    const mock = { id: 4, status: 'shipped' }
    // @ts-expect-error mocked
    db.shipment.update.mockResolvedValue(mock)

    const res = await shipment.updateShipment(4, { status: 'shipped' })
    expect(db.shipment.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { status: 'shipped' },
    })
    expect(res).toEqual(mock)
  })

  it('listShipments returns paginated data', async () => {
    const mockData = [{ id: 1, status: 'pending' }]
    // @ts-expect-error mocked
    db.shipment.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.shipment.findMany.mockResolvedValue(mockData)

    const res = await shipment.listShipments({ page: 1, limit: 10 })
    expect(res.data).toEqual(mockData)
    expect(res.meta.total).toBe(1)
  })

  it('listShipments accepts filters', async () => {
    const mockData = [{ id: 2, status: 'delivered' }]
    // @ts-expect-error mocked
    db.shipment.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.shipment.findMany.mockResolvedValue(mockData)

    const res = await shipment.listShipments({
      status: 'delivered',
      orderId: 10,
    })
    expect(db.shipment.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })

  it('listShipments handles trackingNumber filter and safe pagination', async () => {
    const mockData = [{ id: 3 }]
    // @ts-expect-error mocked
    db.shipment.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.shipment.findMany.mockResolvedValue(mockData)

    const res = await shipment.listShipments({
      page: 0,
      limit: 200,
      trackingNumber: 'TRK-1',
    })
    expect(res.meta.limit).toBe(100)
    expect(db.shipment.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })
})
