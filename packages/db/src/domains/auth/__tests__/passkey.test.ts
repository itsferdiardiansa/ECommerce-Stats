import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Passkeys } from '../passkey'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    passkey: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('Passkeys', () => {
  beforeEach(() => vi.clearAllMocks())

  it('create should call db.passkey.create', async () => {
    const mock = { id: 'p1' }
    // @ts-expect-error mocked
    db.passkey.create.mockResolvedValue(mock)

    const res = await Passkeys.create({
      userId: 1,
      credentialId: 'c1',
      publicKey: 'k',
      counter: 0n,
      deviceType: 'singleDevice',
      backedUp: false,
      transports: ['internal'],
      userHandle: 'h',
    })
    expect(db.passkey.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('findByCredentialId should call findUnique', async () => {
    const mock = { id: 'p1', credentialId: 'c1' }
    // @ts-expect-error mocked
    db.passkey.findUnique.mockResolvedValue(mock)

    const res = await Passkeys.findByCredentialId('c1')
    expect(db.passkey.findUnique).toHaveBeenCalledWith({
      where: { credentialId: 'c1' },
    })
    expect(res).toEqual(mock)
  })

  it('countByUser should call count with userId', async () => {
    // @ts-expect-error mocked
    db.passkey.count.mockResolvedValue(2)
    const res = await Passkeys.countByUser(1)
    expect(db.passkey.count).toHaveBeenCalledWith({ where: { userId: 1 } })
    expect(res).toEqual(2)
  })

  it('updateCounterAndUsed should set counter and lastUsedAt', async () => {
    const updated = { credentialId: 'c1', counter: 5n }
    // @ts-expect-error mocked
    db.passkey.update.mockResolvedValue(updated)

    const res = await Passkeys.updateCounterAndUsed('c1', 5n)
    expect(db.passkey.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { credentialId: 'c1' } })
    )
    expect(res).toEqual(updated)
  })

  it('deleteById should scope delete to id and userId', async () => {
    // @ts-expect-error mocked
    db.passkey.deleteMany.mockResolvedValue({ count: 1 })
    const res = await Passkeys.deleteById('p1', 1)
    expect(db.passkey.deleteMany).toHaveBeenCalledWith({
      where: { id: 'p1', userId: 1 },
    })
    expect(res).toEqual({ count: 1 })
  })

  it('rename should scope update to id and userId', async () => {
    // @ts-expect-error mocked
    db.passkey.updateMany.mockResolvedValue({ count: 1 })
    const res = await Passkeys.rename('p1', 1, 'New')
    expect(db.passkey.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', userId: 1 },
      data: { name: 'New' },
    })
    expect(res).toEqual({ count: 1 })
  })
})
