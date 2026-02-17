import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Authenticators } from '../authenticators'
import { db } from '@/libs/prisma'
import type { Prisma } from '@prisma/generated'

vi.mock('@/libs/prisma', () => ({
  db: {
    authenticator: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('Authenticators', () => {
  beforeEach(() => vi.clearAllMocks())

  it('create should call db.authenticator.create', async () => {
    const mock = { credentialID: 'c1' }
    // @ts-expect-error mocked
    db.authenticator.create.mockResolvedValue(mock)

    const res = await Authenticators.create({
      credentialID: 'c1',
      userId: 1,
    } as Prisma.AuthenticatorUncheckedCreateInput)
    expect(db.authenticator.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('findByCredentialID should call findUnique', async () => {
    const mock = { credentialID: 'c1' }
    // @ts-expect-error mocked
    db.authenticator.findUnique.mockResolvedValue(mock)

    const res = await Authenticators.findByCredentialID('c1')
    expect(db.authenticator.findUnique).toHaveBeenCalledWith({
      where: { credentialID: 'c1' },
    })
    expect(res).toEqual(mock)
  })

  it('listByUser should call findMany with userId', async () => {
    const mock = [{ credentialID: 'c1' }]
    // @ts-expect-error mocked
    db.authenticator.findMany.mockResolvedValue(mock)

    const res = await Authenticators.listByUser(1)
    expect(db.authenticator.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
    })
    expect(res).toEqual(mock)
  })

  it('updateCounter should update counter for credentialID', async () => {
    const updated = { credentialID: 'c1', counter: 5 }
    // @ts-expect-error mocked
    db.authenticator.update.mockResolvedValue(updated)

    const res = await Authenticators.updateCounter('c1', 5)
    expect(db.authenticator.update).toHaveBeenCalledWith({
      where: { credentialID: 'c1' },
      data: { counter: 5 },
    })
    expect(res).toEqual(updated)
  })

  it('findMany and delete should call delegated methods', async () => {
    const many = [{ credentialID: 'c1' }]
    // @ts-expect-error mocked
    db.authenticator.findMany.mockResolvedValue(many)
    // @ts-expect-error mocked
    db.authenticator.delete.mockResolvedValue({ credentialID: 'c1' })

    const res = await Authenticators.findMany({ where: { userId: 1 } })
    expect(db.authenticator.findMany).toHaveBeenCalled()
    expect(res).toEqual(many)

    const d = await Authenticators.delete('c1')
    expect(db.authenticator.delete).toHaveBeenCalledWith({
      where: { credentialID: 'c1' },
    })
    expect(d).toEqual({ credentialID: 'c1' })
  })
})
