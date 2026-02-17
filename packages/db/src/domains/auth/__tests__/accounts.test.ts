import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Accounts } from '../accounts'
import { db } from '@/libs/prisma'
import type { Prisma } from '@prisma/generated'

vi.mock('@/libs/prisma', () => ({
  db: {
    account: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

describe('Accounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('create should call db.account.create', async () => {
    const mock = { id: '1', provider: 'google' }
    // @ts-expect-error mocked
    db.account.create.mockResolvedValue(mock)

    const res = await Accounts.create({
      provider: 'google',
      providerAccountId: '123',
      userId: 1,
    } as Prisma.AccountUncheckedCreateInput)
    expect(db.account.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('findByProvider should query by compound key', async () => {
    const mock = { id: '2' }
    // @ts-expect-error mocked
    db.account.findUnique.mockResolvedValue(mock)

    const res = await Accounts.findByProvider('google', '123')
    expect(db.account.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: '123',
        },
      },
    })
    expect(res).toEqual(mock)
  })

  it('unlinkProvider deletes account if exists', async () => {
    // @ts-expect-error mocked
    db.account.findFirst.mockResolvedValue({ id: '5' })
    // @ts-expect-error mocked
    db.account.delete.mockResolvedValue({ id: '5' })

    const res = await Accounts.unlinkProvider(1, 'google')
    expect(db.account.findFirst).toHaveBeenCalled()
    expect(db.account.delete).toHaveBeenCalledWith({ where: { id: '5' } })
    expect(res).toEqual({ id: '5' })
  })

  it('unlinkProvider returns null when not found', async () => {
    // @ts-expect-error mocked
    db.account.findFirst.mockResolvedValue(null)

    const res = await Accounts.unlinkProvider(1, 'github')
    expect(res).toBeNull()
  })

  it('findMany should forward params and return results', async () => {
    const many = [{ id: '1' }]
    // @ts-expect-error mocked
    db.account.findMany.mockResolvedValue(many)

    const res = await Accounts.findMany({ where: { provider: 'google' } })
    expect(db.account.findMany).toHaveBeenCalled()
    expect(res).toEqual(many)
  })

  it('update and delete should call delegates', async () => {
    const updated = { id: '2' }
    const deleted = { id: '3' }
    // @ts-expect-error mocked
    db.account.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.account.delete.mockResolvedValue(deleted)

    const up = await Accounts.update({
      where: { id: '2' },
      data: { provider: 'x' },
    })
    expect(db.account.update).toHaveBeenCalled()
    expect(up).toEqual(updated)

    const d = await Accounts.delete({ id: '3' })
    expect(db.account.delete).toHaveBeenCalledWith({ where: { id: '3' } })
    expect(d).toEqual(deleted)
  })
})
