import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as variant from '../product-variant.js'
import { db } from '@/libs/prisma'
import type {
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from '../index.js'

vi.mock('@/libs/prisma', () => ({
  db: {
    productVariant: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('ProductVariant domain (within product)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createProductVariant should call db.productVariant.create', async () => {
    const mock = { id: 1, sku: 'v1' }
    // @ts-expect-error mocked
    db.productVariant.create.mockResolvedValue(mock)

    const res = await variant.createProductVariant({
      sku: 'v1',
      product: { connect: { id: 2 } },
    } as CreateProductVariantInput)
    expect(db.productVariant.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getProductVariantById and by SKU include product', async () => {
    const mock = { id: 2, sku: 'sku2' }
    // @ts-expect-error mocked
    db.productVariant.findUnique.mockResolvedValue(mock)

    const byId = await variant.getProductVariantById(2)
    expect(db.productVariant.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      include: { product: true },
    })
    expect(byId).toEqual(mock)

    const bySku = await variant.getProductVariantBySku('sku2')
    expect(db.productVariant.findUnique).toHaveBeenCalledWith({
      where: { sku: 'sku2' },
      include: { product: true },
    })
    expect(bySku).toEqual(mock)
  })

  it('updateProductVariant and deleteProductVariant call delegates', async () => {
    const updated = { id: 3 }
    const deleted = { id: 4 }
    // @ts-expect-error mocked
    db.productVariant.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.productVariant.delete.mockResolvedValue(deleted)

    const up = await variant.updateProductVariant(3, {
      name: 'U',
    } as UpdateProductVariantInput)
    expect(db.productVariant.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { name: 'U' },
    })
    expect(up).toEqual(updated)

    const d = await variant.deleteProductVariant(4)
    expect(db.productVariant.delete).toHaveBeenCalledWith({ where: { id: 4 } })
    expect(d).toEqual(deleted)
  })

  it('listProductVariants supports filters and search', async () => {
    const mockData = [{ id: 5 }]
    const mockCount = 1
    // @ts-expect-error mocked
    db.productVariant.count.mockResolvedValue(mockCount)
    // @ts-expect-error mocked
    db.productVariant.findMany.mockResolvedValue(mockData)

    const res = await variant.listProductVariants({
      page: 1,
      limit: 10,
      productId: 2,
      sku: 's1',
      isActive: true,
      search: 'term',
    })
    expect(db.productVariant.count).toHaveBeenCalled()
    expect(db.productVariant.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })

  it('listProductVariants handles safe pagination bounds', async () => {
    const mockData = [{ id: 6 }]
    // @ts-expect-error mocked
    db.productVariant.count.mockResolvedValue(200)
    // @ts-expect-error mocked
    db.productVariant.findMany.mockResolvedValue(mockData)

    const res = await variant.listProductVariants({ page: 0, limit: 200 })
    expect(res.meta.limit).toBe(100)
    expect(res.meta.page).toBe(1)
    expect(db.productVariant.findMany).toHaveBeenCalled()
  })
})
