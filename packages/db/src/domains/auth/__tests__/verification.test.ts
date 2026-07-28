import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Verification } from '../verification'
import { db } from '@/libs/prisma'
import type { Prisma } from '@prisma/generated'

vi.mock('@/libs/prisma', () => ({
  db: {
    verificationLockout: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('Verification (lockouts)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createVerificationLockout should call create', async () => {
    vi.mocked(db.verificationLockout.create).mockResolvedValue({
      id: 1,
    } as never)

    const res = await Verification.createVerificationLockout({
      email: 'a@b.com',
      reason: 'TOO_MANY_ATTEMPTS',
      lockedAt: new Date(),
      expires: new Date(),
    } as Prisma.VerificationLockoutUncheckedCreateInput)
    expect(db.verificationLockout.create).toHaveBeenCalled()
    expect(res).toEqual({ id: 1 })
  })

  it('findActiveVerificationLockout filters active + lowercases email', async () => {
    vi.mocked(db.verificationLockout.findFirst).mockResolvedValue({
      id: 2,
    } as never)

    const res = await Verification.findActiveVerificationLockout('A@B.com')
    const arg = vi.mocked(db.verificationLockout.findFirst).mock.calls[0][0]
    expect(arg?.where?.email).toBe('a@b.com')
    expect(arg?.where?.clearedAt).toBeNull()
    expect(res).toEqual({ id: 2 })
  })

  it('clearVerificationLockout sets clearedAt + clearedBy', async () => {
    vi.mocked(db.verificationLockout.update).mockResolvedValue({
      id: 3,
    } as never)

    await Verification.clearVerificationLockout(3, 99)
    const arg = vi.mocked(db.verificationLockout.update).mock.calls[0][0]
    expect(arg.where).toEqual({ id: 3 })
    expect(arg.data.clearedBy).toBe(99)
    expect(arg.data.clearedAt).toBeInstanceOf(Date)
  })

  it('deleteExpiredVerificationLockouts prunes expired rows', async () => {
    vi.mocked(db.verificationLockout.deleteMany).mockResolvedValue({
      count: 4,
    } as never)

    const res = await Verification.deleteExpiredVerificationLockouts()
    expect(db.verificationLockout.deleteMany).toHaveBeenCalled()
    expect(res).toEqual({ count: 4 })
  })
})
