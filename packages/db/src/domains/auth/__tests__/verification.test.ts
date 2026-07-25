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

  it('deleteToken should call delete', async () => {
    // @ts-expect-error mocked
    db.verificationToken.delete.mockResolvedValue({ id: 't3' })

    const d = await Verification.deleteToken('a', 'b')
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { identifier_token: { identifier: 'a', token: 'b' } },
    })
    expect(d).toEqual({ id: 't3' })
  })
})
