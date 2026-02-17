import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as product from '..'
import { db } from '@/libs/prisma'
import type { CreateProductInput, UpdateProductInput } from '..'

vi.mock('@/libs/prisma', () => ({
  db: {
    product: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Product domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createProduct throws for negative price', async () => {
    await expect(
      product.createProduct({ price: -1 } as CreateProductInput)
    ).rejects.toThrow('Price cannot be negative')
  })

  it('createProduct calls db.product.create for valid price', async () => {
    const mock = { id: 1, name: 'P' }
    // @ts-expect-error mocked
    db.product.create.mockResolvedValue(mock)

    const res = await product.createProduct({
      price: 10,
      name: 'P',
    } as CreateProductInput)
    expect(db.product.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getProductById includes relations', async () => {
    const mock = { id: 2 }
    // @ts-expect-error mocked
    db.product.findUnique.mockResolvedValue(mock)

    const res = await product.getProductById(2)
    expect(db.product.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      include: { category: true, brand: true, images: true, variants: true },
    })
    expect(res).toEqual(mock)
  })

  it('update and delete should call delegates', async () => {
    const updated = { id: 3 }
    const deleted = { id: 4 }
    // @ts-expect-error mocked
    db.product.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.product.delete.mockResolvedValue(deleted)

    const up = await product.updateProduct(3, {
      name: 'Updated',
    } as UpdateProductInput)
    expect(db.product.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { name: 'Updated' },
    })
    expect(up).toEqual(updated)

    const d = await product.deleteProduct(4)
    expect(db.product.delete).toHaveBeenCalledWith({ where: { id: 4 } })
    expect(d).toEqual(deleted)
  })

  it('listProducts supports filters and inStock branches', async () => {
    const mockData = [{ id: 5 }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.product.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.product.findMany.mockResolvedValue(mockData)

    const res1 = await product.listProducts({
      page: 1,
      limit: 10,
      inStock: true,
    })
    expect(db.product.findMany).toHaveBeenCalled()
    expect(res1.data).toEqual(mockData)

    const res2 = await product.listProducts({ inStock: false })
    expect(db.product.findMany).toHaveBeenCalled()
    expect(res2.data).toEqual(mockData)
  })

  it('listProducts handles price range, categoryId, brandId, isActive and search', async () => {
    const mockData = [{ id: 6 }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.product.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.product.findMany.mockResolvedValue(mockData)

    const res = await product.listProducts({
      minPrice: 5,
      maxPrice: 50,
      categoryId: 2,
      brandId: 3,
      isActive: true,
      search: 'term',
    })
    expect(db.product.count).toHaveBeenCalled()
    expect(db.product.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })
})
