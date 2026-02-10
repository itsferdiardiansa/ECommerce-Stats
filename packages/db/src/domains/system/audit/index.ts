import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { AuditLogFilterParams, CreateAuditLogInput } from './types.js'
import { PaginatedResult } from '@/types/filters'

export * from './types.js'

export async function createAuditLog(data: CreateAuditLogInput) {
  return db.auditLog.create({ data })
}

export async function getAuditLogById(id: number) {
  return db.auditLog.findUnique({ where: { id } })
}

export async function listAuditLogs(
  params: AuditLogFilterParams = {}
): Promise<PaginatedResult<Prisma.AuditLogGetPayload<object>>> {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    userId,
    action,
    entity,
    entityId,
    search,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(500, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.AuditLogWhereInput = {}

  if (userId) where.userId = userId
  if (action) where.action = action
  if (entity) where.entity = entity
  if (entityId) where.entityId = entityId

  if (search) {
    where.OR = [{ action: { contains: search, mode: 'insensitive' } }]
  }

  const [total, data] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
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
