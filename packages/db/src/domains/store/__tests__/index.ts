import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/generated'
import { createStoreRepository } from '..'
import type { ApiProduct, ApiOrder } from '../types'

describe('store repository - upsertProduct and upsertOrder', () => {
  let dbMock: Record<string, unknown>

  beforeEach(() => {
    dbMock = {}
  })

  it('upsertProduct creates category/brand/product and product reviews', async () => {
    const product: ApiProduct = {
      product_id: 123,
      name: 'Test Product',
      description: 'A nice product',
      price: 1999,
      brand: 'BrandX',
      category: 'CategoryY',
      rating: 4.5,
      reviews: [{ user_id: 777, rating: 5, comment: 'Great!' }],
    }

    const categoryFindUnique = vi.fn().mockResolvedValue(null)
    const categoryCreate = vi.fn().mockResolvedValue({ id: 10 })
    const brandFindUnique = vi.fn().mockResolvedValue(null)
    const brandCreate = vi.fn().mockResolvedValue({ id: 20 })
    const productUpsert = vi.fn().mockResolvedValue({ id: product.product_id })
    const userFindUnique = vi.fn().mockResolvedValue(null)
    const userCreate = vi.fn().mockResolvedValue({ id: 999 })
    const reviewFindFirst = vi.fn().mockResolvedValue(null)
    const reviewCreate = vi.fn().mockResolvedValue({ id: 1 })

    dbMock.category = { findUnique: categoryFindUnique, create: categoryCreate }
    dbMock.brand = { findUnique: brandFindUnique, create: brandCreate }
    dbMock.product = { upsert: productUpsert }
    dbMock.user = { findUnique: userFindUnique, create: userCreate }
    dbMock.productReview = { findFirst: reviewFindFirst, create: reviewCreate }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    await repo.upsertProduct(product)

    expect(categoryFindUnique).toHaveBeenCalledWith({
      where: { name: 'CategoryY' },
    })
    expect(categoryCreate).toHaveBeenCalled()
    expect(brandFindUnique).toHaveBeenCalledWith({ where: { name: 'BrandX' } })
    expect(brandCreate).toHaveBeenCalled()
    expect(productUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: product.product_id },
        create: expect.objectContaining({
          id: product.product_id,
          name: product.name,
        }),
      })
    )
    expect(reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: product.product_id,
          rating: 5,
          comment: 'Great!',
        }),
      })
    )
  })

  it('upsertOrder links user, upserts order and creates order items', async () => {
    const order: ApiOrder = {
      order_id: 555,
      user_id: 42,
      items: [{ product_id: 123, quantity: 2 }],
      total_price: 3998,
      status: 'PENDING',
    }

    const userFindUnique = vi.fn().mockResolvedValue({ id: 42 })
    const orderUpsert = vi.fn().mockResolvedValue({ id: 900 })
    const productFindUnique = vi.fn().mockResolvedValue({
      id: 123,
      price: 1999,
      sku: 'sku-123',
      name: 'Test Product',
    })
    const orderItemFindFirst = vi.fn().mockResolvedValue(null)
    const orderItemCreate = vi.fn().mockResolvedValue({ id: 1 })

    dbMock.user = { findUnique: userFindUnique }
    dbMock.order = { upsert: orderUpsert }
    dbMock.product = { findUnique: productFindUnique }
    dbMock.orderItem = {
      findFirst: orderItemFindFirst,
      create: orderItemCreate,
    }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    await repo.upsertOrder(order)

    expect(userFindUnique).toHaveBeenCalledWith({ where: { id: 42 } })
    expect(orderUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: order.order_id } })
    )
    expect(productFindUnique).toHaveBeenCalledWith({ where: { id: 123 } })
    expect(orderItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 900,
          productId: 123,
          sku: 'sku-123',
          name: 'Test Product',
        }),
      })
    )
  })

  it('upsertProduct handles existing review update and user.create failure fallback', async () => {
    const product: ApiProduct = {
      product_id: 321,
      name: 'Another Product',
      brand: 'BrandZ',
      category: 'CategoryZ',
      reviews: [{ user_id: 111, rating: 4, comment: 'Nice' }],
    }

    const categoryFindUnique = vi.fn().mockResolvedValue(null)
    const categoryCreate = vi.fn().mockResolvedValue({ id: 30 })
    const brandFindUnique = vi.fn().mockResolvedValue(null)
    const brandCreate = vi.fn().mockResolvedValue({ id: 40 })
    const productUpsert = vi.fn().mockResolvedValue({ id: product.product_id })

    const userFindUnique = vi.fn()
    const userCreate = vi.fn().mockRejectedValueOnce(new Error('insert failed'))
    userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 111 })

    const reviewFindFirst = vi.fn().mockResolvedValue({ id: 5 })
    const reviewUpdate = vi.fn().mockResolvedValue({ id: 5 })

    dbMock.category = { findUnique: categoryFindUnique, create: categoryCreate }
    dbMock.brand = { findUnique: brandFindUnique, create: brandCreate }
    dbMock.product = { upsert: productUpsert }
    dbMock.user = { findUnique: userFindUnique, create: userCreate }
    dbMock.productReview = { findFirst: reviewFindFirst, update: reviewUpdate }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    await repo.upsertProduct(product)

    expect(reviewUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } })
    )
    expect(userCreate).toHaveBeenCalled()
    expect(userFindUnique).toHaveBeenCalled()
  })

  it('upsertOrder skips missing product and sets status when valid enum provided', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { OrderStatus } = await import('@prisma/generated')
    const order: ApiOrder = {
      order_id: 777,
      user_id: 50,
      items: [{ product_id: 9999, quantity: 1 }],
      total_price: 100,
      status: OrderStatus.Pending,
    }

    const userFindUnique = vi.fn().mockResolvedValue({ id: 50 })
    const orderUpsert = vi.fn().mockResolvedValue({ id: 200 })
    const productFindUnique = vi.fn().mockResolvedValue(null)
    const orderItemCreate = vi.fn()

    dbMock.user = { findUnique: userFindUnique }
    dbMock.order = { upsert: orderUpsert }
    dbMock.product = { findUnique: productFindUnique }
    dbMock.orderItem = { create: orderItemCreate }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    await repo.upsertOrder(order)

    expect(orderUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: OrderStatus.Pending }),
      })
    )
    expect(productFindUnique).toHaveBeenCalledWith({ where: { id: 9999 } })
    expect(orderItemCreate).not.toHaveBeenCalled()
  })

  it('ensureUserId creates user when missing', async () => {
    const userFindUnique = vi.fn().mockResolvedValue(null)
    const userCreate = vi.fn().mockResolvedValue({ id: 888 })
    dbMock.user = { findUnique: userFindUnique, create: userCreate }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    const res = await repo.ensureUserId(888)

    expect(userFindUnique).toHaveBeenCalledWith({ where: { id: 888 } })
    expect(userCreate).toHaveBeenCalled()
    expect(res).toBe(888)
  })

  it('upsertOrder updates existing order item when present', async () => {
    const userFindUnique = vi.fn().mockResolvedValue({ id: 60 })
    const orderUpsert = vi.fn().mockResolvedValue({ id: 300 })
    const productFindUnique = vi
      .fn()
      .mockResolvedValue({ id: 200, price: 50, sku: 'sku-200', name: 'P200' })
    const existingItem = { id: 77 }
    const orderItemFindFirst = vi.fn().mockResolvedValue(existingItem)
    const orderItemUpdate = vi.fn().mockResolvedValue({ id: 77 })

    dbMock.user = { findUnique: userFindUnique }
    dbMock.order = { upsert: orderUpsert }
    dbMock.product = { findUnique: productFindUnique }
    dbMock.orderItem = {
      findFirst: orderItemFindFirst,
      update: orderItemUpdate,
    }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    const order = {
      order_id: 999,
      user_id: 60,
      items: [{ product_id: 200, quantity: 2 }],
      total_price: 100,
    }

    await repo.upsertOrder(order as ApiOrder)

    expect(orderItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: existingItem.id } })
    )
  })

  it('upsertProduct handles non-numeric review.user_id (uses provided id)', async () => {
    const product = {
      product_id: 555,
      name: 'StringUser Product',
      brand: 'BrandS',
      category: 'CategoryS',
      reviews: [{ user_id: 'external-1', rating: 3, comment: 'ok' }],
    } as unknown as ApiProduct

    const categoryFindUnique = vi.fn().mockResolvedValue(null)
    const categoryCreate = vi.fn().mockResolvedValue({ id: 50 })
    const brandFindUnique = vi.fn().mockResolvedValue(null)
    const brandCreate = vi.fn().mockResolvedValue({ id: 60 })
    const productUpsert = vi.fn().mockResolvedValue({ id: product.product_id })
    const reviewFindFirst = vi.fn().mockResolvedValue(null)
    const reviewCreate = vi.fn().mockResolvedValue({ id: 2 })

    dbMock.category = { findUnique: categoryFindUnique, create: categoryCreate }
    dbMock.brand = { findUnique: brandFindUnique, create: brandCreate }
    dbMock.product = { upsert: productUpsert }
    dbMock.productReview = { findFirst: reviewFindFirst, create: reviewCreate }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    await repo.upsertProduct(product)

    expect(reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'external-1' }),
      })
    )
  })

  it('upsertOrder with no user and no total_price sets defaults', async () => {
    const orderUpsert = vi.fn().mockResolvedValue({ id: 400 })
    dbMock.order = { upsert: orderUpsert }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    const order = { order_id: 1010, items: [], status: undefined } as ApiOrder

    await repo.upsertOrder(order)

    expect(orderUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ grandTotal: 0, subtotal: 0 }),
      })
    )
  })

  it('ensureCategoryId and ensureBrandId return existing ids or null', async () => {
    const categoryFindUnique = vi.fn().mockResolvedValue({ id: 7 })
    const brandFindUnique = vi.fn().mockResolvedValue({ id: 8 })
    dbMock.category = { findUnique: categoryFindUnique }
    dbMock.brand = { findUnique: brandFindUnique }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    const cat = await repo.ensureCategoryId('Existing')
    const br = await repo.ensureBrandId('ExistingBrand')
    const noneCat = await repo.ensureCategoryId(undefined)

    expect(cat).toBe(7)
    expect(br).toBe(8)
    expect(noneCat).toBeNull()
  })

  it('ensureBrandId returns null for undefined name', async () => {
    const repo = createStoreRepository({} as unknown as PrismaClient)
    const res = await repo.ensureBrandId(undefined)
    expect(res).toBeNull()
  })

  it('upsertProduct calls user.findUnique when review.user_id is numeric', async () => {
    const product: ApiProduct = {
      product_id: 888,
      name: 'UserExist Product',
      brand: 'BrandE',
      category: 'CategoryE',
      reviews: [{ user_id: 222, rating: 5, comment: 'Yes' }],
    }

    const categoryFindUnique = vi.fn().mockResolvedValue(null)
    const categoryCreate = vi.fn().mockResolvedValue({ id: 70 })
    const brandFindUnique = vi.fn().mockResolvedValue(null)
    const brandCreate = vi.fn().mockResolvedValue({ id: 80 })
    const productUpsert = vi.fn().mockResolvedValue({ id: product.product_id })
    const userFindUnique = vi.fn().mockResolvedValue({ id: 222 })
    const reviewFindFirst = vi.fn().mockResolvedValue(null)
    const reviewCreate = vi.fn().mockResolvedValue({ id: 9 })

    dbMock.category = { findUnique: categoryFindUnique, create: categoryCreate }
    dbMock.brand = { findUnique: brandFindUnique, create: brandCreate }
    dbMock.product = { upsert: productUpsert }
    dbMock.user = { findUnique: userFindUnique }
    dbMock.productReview = { findFirst: reviewFindFirst, create: reviewCreate }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    await repo.upsertProduct(product)

    expect(userFindUnique).toHaveBeenCalled()
  })

  it('upsertProduct handles no reviews (skips loop)', async () => {
    const product: ApiProduct = {
      product_id: 444,
      name: 'NoReviews',
      brand: 'BrandN',
      category: 'CategoryN',
    }

    const categoryFindUnique = vi.fn().mockResolvedValue(null)
    const categoryCreate = vi.fn().mockResolvedValue({ id: 90 })
    const brandFindUnique = vi.fn().mockResolvedValue(null)
    const brandCreate = vi.fn().mockResolvedValue({ id: 91 })
    const productUpsert = vi.fn().mockResolvedValue({ id: product.product_id })

    dbMock.category = { findUnique: categoryFindUnique, create: categoryCreate }
    dbMock.brand = { findUnique: brandFindUnique, create: brandCreate }
    dbMock.product = { upsert: productUpsert }

    const repo = createStoreRepository(dbMock as unknown as PrismaClient)

    await repo.upsertProduct(product)

    expect(productUpsert).toHaveBeenCalled()
  })
})
