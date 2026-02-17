import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as category from '..'
import { db } from '@/libs/prisma'
import type { CreateCategoryInput, UpdateCategoryInput } from '..'

vi.mock('@/libs/prisma', () => ({
  db: {
    category: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Category domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createCategory generates slug when missing and calls create', async () => {
    const input = { name: 'My Category' }
    const mock = { id: 1, name: 'My Category', slug: 'my-category' }
    // @ts-expect-error mocked
    db.category.create.mockResolvedValue(mock)

    const res = await category.createCategory(input as CreateCategoryInput)
    expect(db.category.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getCategoryById includes relations', async () => {
    const mock = { id: 2, parent: null, children: [] }
    // @ts-expect-error mocked
    db.category.findUnique.mockResolvedValue(mock)

    const res = await category.getCategoryById(2)
    expect(db.category.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      include: { parent: true, children: true },
    })
    expect(res).toEqual(mock)
  })

  it('getCategoryBySlug includes relations', async () => {
    const mock = { id: 3 }
    // @ts-expect-error mocked
    db.category.findUnique.mockResolvedValue(mock)

    const res = await category.getCategoryBySlug('sluggy')
    expect(db.category.findUnique).toHaveBeenCalledWith({
      where: { slug: 'sluggy' },
      include: { parent: true, children: true },
    })
    expect(res).toEqual(mock)
  })

  it('updateCategory calls update', async () => {
    const mock = { id: 4, name: 'Updated' }
    // @ts-expect-error mocked
    db.category.update.mockResolvedValue(mock)

    const res = await category.updateCategory(4, {
      name: 'Updated',
    } as UpdateCategoryInput)
    expect(db.category.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { name: 'Updated' },
    })
    expect(res).toEqual(mock)
  })

  it('deleteCategory calls delete', async () => {
    const mock = { id: 5 }
    // @ts-expect-error mocked
    db.category.delete.mockResolvedValue(mock)

    const res = await category.deleteCategory(5)
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: 5 } })
    expect(res).toEqual(mock)
  })

  it('listCategories returns paginated data and applies filters', async () => {
    const mockData = [{ id: 1, name: 'A' }]
    // @ts-expect-error mocked
    db.category.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.category.findMany.mockResolvedValue(mockData)

    const res = await category.listCategories({
      page: 1,
      limit: 10,
      parentId: 2,
      isActive: true,
    })
    expect(res.data).toEqual(mockData)
    expect(res.meta.total).toBe(1)

    expect(db.category.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ parentId: 2, isActive: true }),
      })
    )
  })

  it('listCategories handles search OR clause', async () => {
    const mockData = [{ id: 9, name: 'SearchCat' }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.category.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.category.findMany.mockResolvedValue(mockData)

    const res = await category.listCategories({ search: 'Search' })
    expect(db.category.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })
})
