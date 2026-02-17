import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  ShipmentFilterParams,
  CreateShipmentInput,
  UpdateShipmentInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export async function createShipment(data: CreateShipmentInput) {
  return db.shipment.create({ data })
}

export async function getShipmentById(id: number) {
  return db.shipment.findUnique({
    where: { id },
    include: {
      order: true,
    },
  })
}

export async function getShipmentByTrackingNumber(trackingNumber: string) {
  return db.shipment.findFirst({ where: { trackingNumber } })
}

export async function updateShipment(id: number, data: UpdateShipmentInput) {
  return db.shipment.update({ where: { id }, data })
}

export async function listShipments(
  params: ShipmentFilterParams = {}
): Promise<PaginatedResult<Prisma.ShipmentGetPayload<object>>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    orderId,
    status,
    trackingNumber,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.ShipmentWhereInput = {}

  if (orderId) where.orderId = orderId
  if (status) where.status = status
  if (trackingNumber) where.trackingNumber = trackingNumber

  const [total, data] = await Promise.all([
    db.shipment.count({ where }),
    db.shipment.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
    }),
  ])

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  }
}
