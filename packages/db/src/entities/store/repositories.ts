import { OrderStatus } from '../../../prisma/generated'
import type { PrismaClient, User } from '../../../prisma/generated'
import type { ApiOrder, ApiProduct } from './types'

export type StoreRepository = ReturnType<typeof createStoreRepository>

export function createStoreRepository(db: PrismaClient) {
  async function ensureCategoryId(name?: string) {
    if (!name) return null
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = await db.category.findUnique({ where: { name: trimmed } })
    if (existing) return existing.id
    const created = await db.category.create({ data: { name: trimmed } })
    return created.id
  }

  async function ensureBrandId(name?: string) {
    if (!name) return null
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = await db.brand.findUnique({ where: { name: trimmed } })
    if (existing) return existing.id
    const created = await db.brand.create({ data: { name: trimmed } })
    return created.id
  }

  async function ensureUserId(userId?: number) {
    if (typeof userId !== 'number') return null
    const existing = await db.user.findUnique({ where: { id: userId } })
    if (existing) return existing.id
    const email = `external-order-${userId}@example.com`
    const created = await db.user.create({
      data: {
        id: userId,
        email,
        name: `External User ${userId}`,
        isActive: true,
      },
    })
    return created.id
  }

  async function upsertProduct(product: ApiProduct) {
    const syncedAt = new Date()
    const categoryId = await ensureCategoryId(product.category)
    const brandId = await ensureBrandId(product.brand)
    await db.product.upsert({
      where: { id: product.product_id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        image: product.image,
        discount: product.discount,
        availability: product.availability,
        rating: product.rating,
        categoryId,
        brandId,
        syncedAt,
      },
      create: {
        id: product.product_id,
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        image: product.image,
        discount: product.discount,
        availability: product.availability,
        rating: product.rating,
        categoryId,
        brandId,
        syncedAt,
      },
    })
    if (Array.isArray(product.reviews)) {
      for (const review of product.reviews) {
        let internalUser: User | null = null
        if (typeof review.user_id === 'number') {
          const email = `external+${review.user_id}@example.com`
          internalUser = await db.user.findUnique({ where: { email } })
          if (!internalUser) {
            try {
              internalUser = await db.user.create({
                data: {
                  email,
                  name: `External User ${review.user_id}`,
                },
              })
            } catch (_) {
              internalUser = await db.user.findUnique({ where: { email } })
            }
          }
        }
        const reviewUserId = internalUser?.id ?? review.user_id
        await db.productReview.upsert({
          where: {
            productId_userId: {
              productId: product.product_id,
              userId: reviewUserId,
            },
          },
          update: {
            rating: review.rating,
            comment: review.comment,
            syncedAt,
          },
          create: {
            productId: product.product_id,
            userId: reviewUserId,
            rating: review.rating,
            comment: review.comment,
            syncedAt,
          },
        })
      }
    }
  }

  async function upsertOrder(order: ApiOrder) {
    const syncedAt = new Date()
    const status =
      order.status &&
      OrderStatus &&
      Object.values(OrderStatus).includes(order.status as OrderStatus)
        ? (order.status as (typeof OrderStatus)[keyof typeof OrderStatus])
        : undefined
    const linkedUserId = await ensureUserId(order.user_id)
    const orderRecord = await db.order.upsert({
      where: { id: order.order_id },
      update: {
        userId: linkedUserId ?? undefined,
        status,
        totalPrice: order.total_price,
        syncedAt,
      },
      create: {
        id: order.order_id,
        userId: linkedUserId ?? undefined,
        status,
        totalPrice: order.total_price,
        syncedAt,
      },
    })
    for (const item of order.items) {
      const product = await db.product.findUnique({
        where: { id: item.product_id },
      })
      if (!product) continue
      await db.orderItem.upsert({
        where: {
          orderId_productId: { orderId: orderRecord.id, productId: product.id },
        },
        update: {
          quantity: item.quantity,
          unitPrice: product.price as number,
          syncedAt,
        },
        create: {
          orderId: orderRecord.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price as number,
          syncedAt,
        },
      })
    }
  }

  return {
    ensureCategoryId,
    ensureBrandId,
    ensureUserId,
    upsertProduct,
    upsertOrder,
  }
}
