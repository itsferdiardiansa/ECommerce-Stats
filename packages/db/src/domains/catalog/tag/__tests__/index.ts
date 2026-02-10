import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as tag from '../index.js'
import { db } from '@/libs/prisma'
import type { CreateTagInput } from '../index.js'

vi.mock('@/libs/prisma', () => ({
  db: {
    tag: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Tag domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createTag generates slug when missing and calls create', async () => {
    const input = { name: 'My Tag' }
    const mock = { id: 1, name: 'My Tag', slug: 'my-tag' }
    // @ts-expect-error mocked
    db.tag.create.mockResolvedValue(mock)

    const res = await tag.createTag(input as CreateTagInput)
    expect(db.tag.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getTagById calls findUnique and listTags returns paginated data', async () => {
    const mock = { id: 2 }
    // @ts-expect-error mocked
    db.tag.findUnique.mockResolvedValue(mock)
    // @ts-expect-error mocked
    db.tag.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.tag.findMany.mockResolvedValue([mock])

    const res = await tag.getTagById(2)
    expect(db.tag.findUnique).toHaveBeenCalledWith({ where: { id: 2 } })
    expect(res).toEqual(mock)

    const list = await tag.listTags({
      page: 1,
      limit: 10,
      search: 'My',
      type: 'general',
    })
    expect(db.tag.count).toHaveBeenCalled()
    expect(db.tag.findMany).toHaveBeenCalled()
    expect(list.data).toEqual([mock])
  })

  it('createTag preserves provided slug and generates cleaned slug for complex names', async () => {
    const inputWithSlug = { name: 'Provided', slug: 'provided-slug' }
    const inputComplex = { name: '  Hello -- World!!' }

    const mock1 = { id: 3, slug: 'provided-slug' }
    // @ts-expect-error mocked
    db.tag.create.mockResolvedValueOnce(mock1)

    const res1 = await tag.createTag(inputWithSlug as CreateTagInput)
    expect(db.tag.create).toHaveBeenCalledWith({ data: inputWithSlug })
    expect(res1).toEqual(mock1)

    let capturedArg: {
      data: CreateTagInput
    } | null = null

    // @ts-expect-error mocked
    db.tag.create.mockImplementationOnce(args => {
      capturedArg = args
      return Promise.resolve({ id: 4, ...args.data })
    })

    const res2 = await tag.createTag(inputComplex as CreateTagInput)
    expect(capturedArg).not.toBeNull()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(capturedArg!.data.slug).toBe('hello-world')
    expect(res2.slug).toBe('hello-world')
  })

  it('updateTag and deleteTag forward to db', async () => {
    const updated = { id: 5 }
    const deleted = { id: 6 }
    // @ts-expect-error mocked
    db.tag.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.tag.delete.mockResolvedValue(deleted)

    const up = await tag.updateTag(5, {
      name: 'U',
    } as import('..').UpdateTagInput)
    expect(db.tag.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { name: 'U' },
    })
    expect(up).toEqual(updated)

    const d = await tag.deleteTag(6)
    expect(db.tag.delete).toHaveBeenCalledWith({ where: { id: 6 } })
    expect(d).toEqual(deleted)
  })

  it('listTags default params without search or type', async () => {
    const mock = { id: 7 }
    // @ts-expect-error mocked
    db.tag.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.tag.findMany.mockResolvedValue([mock])

    const res = await tag.listTags()
    expect(res.meta.page).toBe(1)
    expect(res.meta.limit).toBe(50)
    expect(res.data).toEqual([mock])
  })
})
