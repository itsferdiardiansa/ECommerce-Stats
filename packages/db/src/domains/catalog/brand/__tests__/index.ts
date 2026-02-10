import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as brand from '../index.js'
import { db } from '@/libs/prisma'
import type { CreateBrandInput, UpdateBrandInput } from '../index.js'

vi.mock('@/libs/prisma', () => ({
  db: {
    brand: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Brand domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createBrand generates slug when missing and calls create', async () => {
    const input = { name: 'My Brand' }
    const mock = { id: 1, name: 'My Brand', slug: 'my-brand' }
    // @ts-expect-error mocked
    db.brand.create.mockResolvedValue(mock)

    const res = await brand.createBrand(input as CreateBrandInput)
    expect(db.brand.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getBrandById calls findUnique', async () => {
    const mock = { id: 2 }
    // @ts-expect-error mocked
    db.brand.findUnique.mockResolvedValue(mock)

    const res = await brand.getBrandById(2)
    expect(db.brand.findUnique).toHaveBeenCalledWith({ where: { id: 2 } })
    expect(res).toEqual(mock)
  })

  it('getBrandBySlug calls findUnique', async () => {
    const mock = { id: 3 }
    // @ts-expect-error mocked
    db.brand.findUnique.mockResolvedValue(mock)

    const res = await brand.getBrandBySlug('sluggy')
    expect(db.brand.findUnique).toHaveBeenCalledWith({
      where: { slug: 'sluggy' },
    })
    expect(res).toEqual(mock)
  })

  it('updateBrand calls update', async () => {
    const mock = { id: 4, name: 'Updated' }
    // @ts-expect-error mocked
    db.brand.update.mockResolvedValue(mock)

    const res = await brand.updateBrand(4, {
      name: 'Updated',
    } as UpdateBrandInput)
    expect(db.brand.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { name: 'Updated' },
    })
    expect(res).toEqual(mock)
  })

  it('deleteBrand calls delete', async () => {
    const mock = { id: 5 }
    // @ts-expect-error mocked
    db.brand.delete.mockResolvedValue(mock)

    const res = await brand.deleteBrand(5)
    expect(db.brand.delete).toHaveBeenCalledWith({ where: { id: 5 } })
    expect(res).toEqual(mock)
  })

  it('listBrands returns paginated data', async () => {
    const mockData = [{ id: 1, name: 'A' }]
    // @ts-expect-error mocked
    db.brand.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.brand.findMany.mockResolvedValue(mockData)

    const res = await brand.listBrands({ page: 1, limit: 10 })
    expect(res.data).toEqual(mockData)
    expect(res.meta.total).toBe(1)
  })

  it('listBrands accepts search and country filters', async () => {
    const mockData = [{ id: 2, name: 'B' }]
    // @ts-expect-error mocked
    db.brand.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.brand.findMany.mockResolvedValue(mockData)

    const res = await brand.listBrands({
      search: 'B',
      country: 'US',
      isActive: true,
    })
    expect(db.brand.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })
})
