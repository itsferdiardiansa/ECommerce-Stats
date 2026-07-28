import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OAuthAccounts } from '../oauth-account'
import { db } from '@/libs/prisma'
import type { Prisma } from '@prisma/generated'

vi.mock('@/libs/prisma', () => ({
  db: {
    oAuthAccount: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

describe('OAuthAccounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('create should call db.oAuthAccount.create', async () => {
    const mock = { id: '1', provider: 'google' }
    // @ts-expect-error mocked
    db.oAuthAccount.create.mockResolvedValue(mock)

    const res = await OAuthAccounts.create({
      provider: 'google',
      providerAccountId: '123',
      userId: 1,
    } as Prisma.OAuthAccountUncheckedCreateInput)
    expect(db.oAuthAccount.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('findByProvider should query by compound key', async () => {
    const mock = { id: '2' }
    // @ts-expect-error mocked
    db.oAuthAccount.findUnique.mockResolvedValue(mock)

    const res = await OAuthAccounts.findByProvider('google', '123')
    expect(db.oAuthAccount.findUnique).toHaveBeenCalledWith({
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
    db.oAuthAccount.findFirst.mockResolvedValue({ id: '5' })
    // @ts-expect-error mocked
    db.oAuthAccount.delete.mockResolvedValue({ id: '5' })

    const res = await OAuthAccounts.unlinkProvider(1, 'google')
    expect(db.oAuthAccount.findFirst).toHaveBeenCalled()
    expect(db.oAuthAccount.delete).toHaveBeenCalledWith({ where: { id: '5' } })
    expect(res).toEqual({ id: '5' })
  })

  it('unlinkProvider returns null when not found', async () => {
    // @ts-expect-error mocked
    db.oAuthAccount.findFirst.mockResolvedValue(null)

    const res = await OAuthAccounts.unlinkProvider(1, 'github')
    expect(res).toBeNull()
  })

  it('findMany should forward params and return results', async () => {
    const many = [{ id: '1' }]
    // @ts-expect-error mocked
    db.oAuthAccount.findMany.mockResolvedValue(many)

    const res = await OAuthAccounts.findMany({ where: { provider: 'google' } })
    expect(db.oAuthAccount.findMany).toHaveBeenCalled()
    expect(res).toEqual(many)
  })

  it('update and delete should call delegates', async () => {
    const updated = { id: '2' }
    const deleted = { id: '3' }
    // @ts-expect-error mocked
    db.oAuthAccount.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.oAuthAccount.delete.mockResolvedValue(deleted)

    const up = await OAuthAccounts.update({
      where: { id: '2' },
      data: { provider: 'x' },
    })
    expect(db.oAuthAccount.update).toHaveBeenCalled()
    expect(up).toEqual(updated)

    const d = await OAuthAccounts.delete({ id: '3' })
    expect(db.oAuthAccount.delete).toHaveBeenCalledWith({ where: { id: '3' } })
    expect(d).toEqual(deleted)
  })
})
