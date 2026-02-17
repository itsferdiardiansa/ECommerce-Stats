import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PasswordSecurity } from '../password-history'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    passwordHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('PasswordSecurity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('archivePassword should write to passwordHistory', async () => {
    // @ts-expect-error mocked
    db.passwordHistory.create.mockResolvedValue({ id: 1 })

    const res = await PasswordSecurity.archivePassword(1, 'hash')
    expect(db.passwordHistory.create).toHaveBeenCalledWith({
      data: { userId: 1, password: 'hash' },
    })
    expect(res).toEqual({ id: 1 })
  })

  it('getRecentPasswords returns list', async () => {
    // @ts-expect-error mocked
    db.passwordHistory.findMany.mockResolvedValue([{ password: 'a' }])

    const res = await PasswordSecurity.getRecentPasswords(1, 3)
    expect(db.passwordHistory.findMany).toHaveBeenCalled()
    expect(res).toEqual([{ password: 'a' }])
  })

  it('findMany forwards params', async () => {
    const many = [{ password: 'x' }]
    // @ts-expect-error mocked
    db.passwordHistory.findMany.mockResolvedValue(many)

    const res = await PasswordSecurity.findMany({ where: { userId: 1 } })
    expect(db.passwordHistory.findMany).toHaveBeenCalled()
    expect(res).toEqual(many)
  })
})
