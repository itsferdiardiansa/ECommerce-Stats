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
    } as Prisma.SessionUncheckedCreateInput)
    expect(db.session.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('findByToken includes user', async () => {
    const mock = { id: 's1', user: { id: 1 } }
    // @ts-expect-error mocked
    db.session.findUnique.mockResolvedValue(mock)

    const res = await Sessions.findByToken('tok')
    expect(db.session.findUnique).toHaveBeenCalledWith({
      where: { sessionToken: 'tok' },
      include: { user: true },
    })
    expect(res).toEqual(mock)
  })

  it('findById should call findUnique', async () => {
    const mock = { id: 's2' }
    // @ts-expect-error mocked
    db.session.findUnique.mockResolvedValue(mock)

    const res = await Sessions.findById('s2')
    expect(db.session.findUnique).toHaveBeenCalledWith({ where: { id: 's2' } })
    expect(res).toEqual(mock)
  })

  it('findMany, update and delete should call respective delegates', async () => {
    const many = [{ id: 's1' }]
    // @ts-expect-error mocked
    db.session.findMany.mockResolvedValue(many)
    // @ts-expect-error mocked
    db.session.update.mockResolvedValue({ id: 's1', sessionToken: 't' })
    // @ts-expect-error mocked
    db.session.delete.mockResolvedValue({ id: 's3' })

    const res = await Sessions.findMany({ where: { userId: 1 } })
    expect(db.session.findMany).toHaveBeenCalled()
    expect(res).toEqual(many)

    const up = await Sessions.update({
      where: { id: 's1' },
      data: { sessionToken: 't' },
    })
    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { sessionToken: 't' },
    })
    expect(up).toEqual({ id: 's1', sessionToken: 't' })

    const d = await Sessions.delete('s3')
    expect(db.session.delete).toHaveBeenCalledWith({
      where: { sessionToken: 's3' },
    })
    expect(d).toEqual({ id: 's3' })
  })

  it('deleteByUser calls deleteMany', async () => {
    // @ts-expect-error mocked
    db.session.deleteMany.mockResolvedValue({ count: 2 })

    const res = await Sessions.deleteByUser(1)
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } })
    expect(res).toEqual({ count: 2 })
  })
})
