import { OrderStatus } from '@prisma/generated'
import type { PrismaClient, User } from '@prisma/generated'
import type { ApiOrder, ApiProduct } from './types'
import { normalizeName, slugify, makeExternalUserData } from '@/libs/utils'

export type StoreRepository = ReturnType<typeof createStoreRepository>

export function createStoreRepository(db: PrismaClient) {
  async function ensureCategoryId(name?: string) {
    const normalized = normalizeName(name)

    if (!normalized) return null

    const existing = await db.category.findUnique({
      where: { name: normalized },
    })

    if (existing) return existing.id

    const slug = slugify(normalized, 'cat')
    const created = await db.category.create({
      data: { name: normalized, slug },
    })

    return created.id
  }

  async function ensureBrandId(name?: string) {
    const normalized = normalizeName(name)

    if (!normalized) return null

    const existing = await db.brand.findUnique({ where: { name: normalized } })

    if (existing) return existing.id

    const slug = slugify(normalized, 'brand')
    const created = await db.brand.create({ data: { name: normalized, slug } })

    return created.id
  }

  async function ensureUserId(userId?: number) {
    if (typeof userId !== 'number') return null

    const existing = await db.user.findUnique({ where: { id: userId } })

    if (existing) return existing.id

    const data = makeExternalUserData(userId)
    const created = await db.user.create({ data })

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
        rating: product.rating,
        categoryId,
        brandId,
        syncedAt,
      },
      create: {
        id: product.product_id,
        sku: `sku-${product.product_id}`,
        slug:
          product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
          `-${product.product_id}`,
        name: product.name,
        description: product.description,
        price: product.price,
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
                  username: `external_${review.user_id}_${Date.now()}`,
                  passwordHash: '',
                  name: `External User ${review.user_id}`,
                },
              })
            } catch {
              internalUser = await db.user.findUnique({ where: { email } })
            }
          }
        }

        const reviewUserId = internalUser?.id ?? review.user_id
        const existingReview = await db.productReview.findFirst({
          where: {
            productId: product.product_id,
            userId: reviewUserId,
          },
        })

        if (existingReview) {
          await db.productReview.update({
            where: { id: existingReview.id },
            data: {
              rating: review.rating,
              comment: review.comment,
              syncedAt,
            },
          })
        } else {
          await db.productReview.create({
            data: {
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

    const orderData = {
      userId: linkedUserId ?? undefined,
      status,
      grandTotal: order.total_price || 0,
      subtotal: order.total_price || 0,
      syncedAt,
    }

    const orderRecord = await db.order.upsert({
      where: { id: order.order_id },
      update: orderData,
      create: {
        id: order.order_id,
        orderNumber: `ORD-${order.order_id}`,
        ...orderData,
      },
    })

    for (const item of order.items) {
      const product = await db.product.findUnique({
        where: { id: item.product_id },
      })
      if (!product) continue

      const existingItem = await db.orderItem.findFirst({
        where: {
          orderId: orderRecord.id,
          productId: product.id,
        },
      })

      const itemData = {
        quantity: item.quantity,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unitPrice: product.price as any,
        totalPrice: Number(product.price) * item.quantity,
        syncedAt,
      }

      if (existingItem) {
        await db.orderItem.update({
          where: { id: existingItem.id },
          data: itemData,
        })
      } else {
        await db.orderItem.create({
          data: {
            orderId: orderRecord.id,
            productId: product.id,
            sku: product.sku,
            name: product.name,
            ...itemData,
          },
        })
      }
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
