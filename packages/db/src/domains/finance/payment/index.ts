import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  PaymentFilterParams,
  CreatePaymentInput,
  UpdatePaymentInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export * from './types'

export async function createPayment(data: CreatePaymentInput) {
  return db.payment.create({ data })
}

export async function getPaymentById(id: number) {
  return db.payment.findUnique({
    where: { id },
    include: {
      order: true,
    },
  })
}

export async function getPaymentByTransactionId(transactionId: string) {
  return db.payment.findUnique({ where: { transactionId } })
}

export async function updatePayment(id: number, data: UpdatePaymentInput) {
  return db.payment.update({ where: { id }, data })
}

export async function listPayments(
  params: PaymentFilterParams = {}
): Promise<PaginatedResult<Prisma.PaymentGetPayload<object>>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    orderId,
    provider,
    status,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.PaymentWhereInput = {}

  if (orderId) where.orderId = orderId
  if (provider) where.provider = provider
  if (status) where.status = status

  const [total, data] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
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
