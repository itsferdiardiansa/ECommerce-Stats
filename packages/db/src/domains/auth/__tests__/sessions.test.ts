import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Sessions } from '../sessions'
import { db } from '@/libs/prisma'
import type { Prisma } from '@prisma/generated'

vi.mock('@/libs/prisma', () => ({
  db: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('Sessions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('create should call db.session.create', async () => {
    const mock = { id: 's1', sessionToken: 'tok' }
    // @ts-expect-error mocked
    db.session.create.mockResolvedValue(mock)

    const res = await Sessions.create({
      sessionToken: 'tok',
      userId: 1,
      jti: 'jti',
      refreshTokenHash: 'refresh-token-hash',
      deviceFingerprint: 'device-fingerprint',
      expires: new Date(),
    } as Prisma.SessionUncheckedCreateInput)
    expect(db.session.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })
})
