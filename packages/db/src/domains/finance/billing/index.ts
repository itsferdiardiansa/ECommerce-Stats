import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  PlanFilterParams,
  CreatePlanInput,
  UpdatePlanInput,
  SubscriptionFilterParams,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  InvoiceFilterParams,
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from './types.js'
import { PaginatedResult } from '@/types/filters'

export * from './types.js'

export async function createPlan(data: CreatePlanInput) {
  return db.plan.create({ data })
}

export async function getPlanById(id: string) {
  return db.plan.findUnique({ where: { id } })
}

export async function updatePlan(id: string, data: UpdatePlanInput) {
  return db.plan.update({ where: { id }, data })
}

export async function deletePlan(id: string) {
  return db.plan.delete({ where: { id } })
}

export async function listPlans(
  params: PlanFilterParams = {}
): Promise<PaginatedResult<Prisma.PlanGetPayload<object>>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'price',
    sortOrder = 'asc',
    search,
    isActive,
    interval,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.PlanWhereInput = {}

  if (isActive !== undefined) where.isActive = isActive
  if (interval) where.interval = interval

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, data] = await Promise.all([
    db.plan.count({ where }),
    db.plan.findMany({
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

export async function createSubscription(data: CreateSubscriptionInput) {
  return db.subscription.create({ data })
}

export async function getSubscriptionById(id: string) {
  return db.subscription.findUnique({
    where: { id },
    include: { plan: true, organization: true },
  })
}

export async function updateSubscription(
  id: string,
  data: UpdateSubscriptionInput
) {
  return db.subscription.update({ where: { id }, data })
}

export async function listSubscriptions(
  params: SubscriptionFilterParams = {}
): Promise<
  PaginatedResult<Prisma.SubscriptionGetPayload<{ include: { plan: true } }>>
> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    organizationId,
    planId,
    status,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.SubscriptionWhereInput = {}

  if (organizationId) where.organizationId = organizationId
  if (planId) where.planId = planId
  if (status) where.status = status

  const [total, data] = await Promise.all([
    db.subscription.count({ where }),
    db.subscription.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        plan: true,
      },
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

export async function createInvoice(data: CreateInvoiceInput) {
  return db.invoice.create({ data })
}

export async function getInvoiceById(id: string) {
  return db.invoice.findUnique({
    where: { id },
    include: { subscription: { include: { plan: true } } },
  })
}

export async function updateInvoice(id: string, data: UpdateInvoiceInput) {
  return db.invoice.update({ where: { id }, data })
}

export async function listInvoices(
  params: InvoiceFilterParams = {}
): Promise<PaginatedResult<Prisma.InvoiceGetPayload<object>>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    organizationId,
    subscriptionId,
    status,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.InvoiceWhereInput = {}

  if (organizationId) where.organizationId = organizationId
  if (subscriptionId) where.subscriptionId = subscriptionId
  if (status) where.status = status

  const [total, data] = await Promise.all([
    db.invoice.count({ where }),
    db.invoice.findMany({
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
