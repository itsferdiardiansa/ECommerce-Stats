import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginLogs } from '../login-history'
import { LoginReason } from '@prisma/generated'
import { db } from '@/libs/prisma'
import type { Prisma } from '@prisma/generated'

vi.mock('@/libs/prisma', () => ({
  db: {
    loginHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('LoginLogs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('logSuccess should create a success log', async () => {
    // @ts-expect-error mocked
    db.loginHistory.create.mockResolvedValue({ id: 'l1', isSuccess: true })

    const res = await LoginLogs.logSuccess(1, { ip: '1.2.3.4', agent: 'ua' })
    expect(db.loginHistory.create).toHaveBeenCalled()
    expect(res).toEqual({ id: 'l1', isSuccess: true })
  })

  it('logFailure should create a failure log with reason', async () => {
    // @ts-expect-error mocked
    db.loginHistory.create.mockResolvedValue({ id: 'l2', isSuccess: false })

    const res = await LoginLogs.logFailure(LoginReason.INVALID_PASSWORD, {
      userId: 1,
      ip: '1.2.3.4',
    })
    expect(db.loginHistory.create).toHaveBeenCalled()
    expect(res).toEqual({ id: 'l2', isSuccess: false })
  })

  it('logAttempt should create an attempt log', async () => {
    // @ts-expect-error mocked
    db.loginHistory.create.mockResolvedValue({ id: 'l0' })

    const res = await LoginLogs.logAttempt({
      userId: 1,
      isSuccess: false,
    } as Prisma.LoginHistoryUncheckedCreateInput)
    expect(db.loginHistory.create).toHaveBeenCalled()
    expect(res).toEqual({ id: 'l0' })
  })

  it('getRecentAttempts filters by createdAt', async () => {
    // @ts-expect-error mocked
    db.loginHistory.findMany.mockResolvedValue([{ id: 'l3' }])

    const res = await LoginLogs.getRecentAttempts(1, 10)
    expect(db.loginHistory.findMany).toHaveBeenCalled()
    expect(res).toEqual([{ id: 'l3' }])
  })

  it('findMany forwards params to db.loginHistory.findMany', async () => {
    const many = [{ id: 'x' }]
    // @ts-expect-error mocked
    db.loginHistory.findMany.mockResolvedValue(many)

    const res = await LoginLogs.findMany({ where: { userId: 1 }, take: 5 })
    expect(db.loginHistory.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      skip: undefined,
      take: 5,
      cursor: undefined,
      orderBy: undefined,
    })
    expect(res).toEqual(many)
  })

  it('deleteOlderThan prunes rows before the cutoff', async () => {
    // @ts-expect-error mocked
    db.loginHistory.deleteMany.mockResolvedValue({ count: 7 })

    const before = Date.now() - 90 * 24 * 60 * 60 * 1000
    const res = await LoginLogs.deleteOlderThan(90)

    const arg = (
      db.loginHistory.deleteMany as unknown as {
        mock: { calls: Array<[{ where: { createdAt: { lt: Date } } }]> }
      }
    ).mock.calls[0][0]
    expect(arg.where.createdAt.lt.getTime()).toBeGreaterThanOrEqual(
      before - 5000
    )
    expect(arg.where.createdAt.lt.getTime()).toBeLessThanOrEqual(Date.now())
    expect(res).toEqual({ count: 7 })
  })
})
