import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Prisma } from '@prisma/generated'
import * as prisma from '@/libs/prisma'
import { createAuditLog, getAuditLogById, listAuditLogs } from '..'
import type { CreateAuditLogInput } from '../types'

vi.mock('@/libs/prisma', () => {
  const create = vi.fn()
  const findUnique = vi.fn()
  const count = vi.fn()
  const findMany = vi.fn()
  return {
    db: {
      auditLog: {
        create,
        findUnique,
        count,
        findMany,
      },
    },
  }
})

describe('system.audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createAuditLog calls db.auditLog.create with the provided data', async () => {
    const input: CreateAuditLogInput = {
      action: 'CREATE',
      entity: 'User',
      entityId: '42',
    }

    const returned = { id: 1, ...input, createdAt: new Date() }
    ;(
      prisma.db.auditLog.create as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(returned)

    const res = await createAuditLog(input)

    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({ data: input })
    expect(res).toEqual(returned)
  })

  it('getAuditLogById calls findUnique with id', async () => {
    const rec: Prisma.AuditLogGetPayload<object> = {
      id: 2,
      userId: null,
      action: 'UPDATE',
      entity: 'Order',
      entityId: '99',
      oldValues: null,
      newValues: null,
      ipAddress: null,
      userAgent: null,
      metadata: null,
      createdAt: new Date(),
    }

    ;(
      prisma.db.auditLog.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(rec)

    const out = await getAuditLogById(2)

    expect(prisma.db.auditLog.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
    })
    expect(out).toEqual(rec)
  })

  it('listAuditLogs returns paginated result and respects search and filters', async () => {
    const a1: Prisma.AuditLogGetPayload<object> = {
      id: 3,
      userId: 5,
      action: 'DELETE',
      entity: 'Product',
      entityId: '200',
      oldValues: null,
      newValues: null,
      ipAddress: null,
      userAgent: null,
      metadata: null,
      createdAt: new Date(),
    }
    const a2 = { ...a1, id: 4 }

    ;(
      prisma.db.auditLog.count as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(2)
    ;(
      prisma.db.auditLog.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue([a1, a2])

    const params = {
      page: 1,
      limit: 10,
      search: 'DEL',
      userId: 5,
      action: 'DELETE',
    }

    const res = await listAuditLogs(params)

    expect(prisma.db.auditLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 5, action: 'DELETE' }),
      })
    )
    expect(prisma.db.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ action: { contains: 'DEL', mode: 'insensitive' } }],
        }),
      })
    )
    expect(res.meta.total).toBe(2)
    expect(res.data).toHaveLength(2)
  })

  it('listAuditLogs applies safe paging limits and ordering', async () => {
    ;(
      prisma.db.auditLog.count as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(0)
    ;(
      prisma.db.auditLog.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue([])

    const res = await listAuditLogs({
      page: -5,
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    })

    expect(res.meta.page).toBe(1)
    expect(res.meta.limit).toBe(500)
  })

  it('listAuditLogs filters by entity and entityId', async () => {
    ;(
      prisma.db.auditLog.count as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(1)
    ;(
      prisma.db.auditLog.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      {
        id: 10,
        userId: null,
        action: 'ACT',
        entity: 'Product',
        entityId: '200',
        oldValues: null,
        newValues: null,
        ipAddress: null,
        userAgent: null,
        metadata: null,
        createdAt: new Date(),
      },
    ])

    const res = await listAuditLogs({ entity: 'Product', entityId: '200' })

    expect(prisma.db.auditLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entity: 'Product', entityId: '200' }),
      })
    )
    expect(prisma.db.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entity: 'Product', entityId: '200' }),
      })
    )
    expect(res.data).toHaveLength(1)
  })
})
