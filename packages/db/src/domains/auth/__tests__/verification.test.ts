import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Verification } from '../verification'
import { db } from '@/libs/prisma'
import type { Prisma } from '@prisma/generated'

vi.mock('@/libs/prisma', () => ({
  db: {
    verificationToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    twoFactorToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    twoFactorConfirmation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('Verification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createToken should call create', async () => {
    // @ts-expect-error mocked
    db.verificationToken.create.mockResolvedValue({ id: 't1' })

    const res = await Verification.createToken({
      identifier: 'a',
      token: 'b',
    } as Prisma.VerificationTokenUncheckedCreateInput)
    expect(db.verificationToken.create).toHaveBeenCalled()
    expect(res).toEqual({ id: 't1' })
  })

  it('findToken should find by compound key', async () => {
    // @ts-expect-error mocked
    db.verificationToken.findUnique.mockResolvedValue({ id: 't2' })

    const res = await Verification.findToken('a', 'b')
    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { identifier_token: { identifier: 'a', token: 'b' } },
    })
    expect(res).toEqual({ id: 't2' })
  })

  it('twoFactor token lifecycle', async () => {
    // @ts-expect-error mocked
    db.twoFactorToken.create.mockResolvedValue({ id: 'tf1' })
    // @ts-expect-error mocked
    db.twoFactorToken.findUnique.mockResolvedValue({ id: 'tf1' })

    const created = await Verification.createTwoFactorToken({
      email: 'a',
      token: 'b',
    } as Prisma.TwoFactorTokenUncheckedCreateInput)
    expect(db.twoFactorToken.create).toHaveBeenCalled()
    const found = await Verification.findTwoFactorToken('a', 'b')
    expect(db.twoFactorToken.findUnique).toHaveBeenCalled()
    expect(created).toEqual({ id: 'tf1' })
    expect(found).toEqual({ id: 'tf1' })
  })

  it('deleteToken and deleteTwoFactorTokenByEmail should call delete', async () => {
    // @ts-expect-error mocked
    db.verificationToken.delete.mockResolvedValue({ id: 't3' })
    // @ts-expect-error mocked
    db.twoFactorToken.deleteMany.mockResolvedValue({ count: 2 })

    const d = await Verification.deleteToken('a', 'b')
    expect(db.verificationToken.delete).toHaveBeenCalled()
    expect(d).toEqual({ id: 't3' })

    const dm = await Verification.deleteTwoFactorTokenByEmail('a@b.com')
    expect(db.twoFactorToken.deleteMany).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    })
    expect(dm).toEqual({ count: 2 })
  })

  it('twoFactor confirmation create/find/delete', async () => {
    // @ts-expect-error mocked
    db.twoFactorConfirmation.create.mockResolvedValue({ userId: 1 })
    // @ts-expect-error mocked
    db.twoFactorConfirmation.findUnique.mockResolvedValue({ userId: 1 })
    // @ts-expect-error mocked
    db.twoFactorConfirmation.delete.mockResolvedValue({ userId: 1 })

    const c = await Verification.createTwoFactorConfirmation(1)
    expect(db.twoFactorConfirmation.create).toHaveBeenCalled()
    const f = await Verification.findTwoFactorConfirmation(1)
    expect(db.twoFactorConfirmation.findUnique).toHaveBeenCalledWith({
      where: { userId: 1 },
    })
    const d = await Verification.deleteTwoFactorConfirmation(1)
    expect(db.twoFactorConfirmation.delete).toHaveBeenCalledWith({
      where: { userId: 1 },
    })
    expect(c).toEqual({ userId: 1 })
    expect(f).toEqual({ userId: 1 })
    expect(d).toEqual({ userId: 1 })
  })

  it('deleteTwoFactorToken by id should call delete', async () => {
    // @ts-expect-error mocked
    db.twoFactorToken.delete.mockResolvedValue({ id: 'tf2' })

    const res = await Verification.deleteTwoFactorToken('tf2')
    expect(db.twoFactorToken.delete).toHaveBeenCalledWith({
      where: { id: 'tf2' },
    })
    expect(res).toEqual({ id: 'tf2' })
  })
})
