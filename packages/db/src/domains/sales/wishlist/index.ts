import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  CreateWishlistInput,
  UpdateWishlistInput,
  WishlistFilterParams,
} from './types.js'
import { PaginatedResult } from '@/types/filters'

export * from './types.js'

export async function createWishlist(data: CreateWishlistInput) {
  if (!data.token && data.isPublic) {
    data.token = Math.random().toString(36).substring(2, 15)
  }
  return db.wishlist.create({ data })
}

export async function getWishlistById(id: number) {
  return db.wishlist.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: { images: true },
          },
        },
      },
    },
  })
}

export async function getWishlistByToken(token: string) {
  return db.wishlist.findUnique({
    where: { token },
    include: {
      items: { include: { product: true } },
    },
  })
}

export async function updateWishlist(id: number, data: UpdateWishlistInput) {
  return db.wishlist.update({ where: { id }, data })
}

export async function deleteWishlist(id: number) {
  return db.wishlist.delete({ where: { id } })
}

export async function addItemToWishlist(
  wishlistId: number,
  productId: number,
  note?: string
) {
  return db.wishlistItem.create({
    data: {
      wishlistId,
      productId,
      note,
    },
  })
}

export async function removeItemFromWishlist(
  wishlistId: number,
  productId: number
) {
  return db.wishlistItem.delete({
    where: {
      wishlistId_productId: {
        wishlistId,
        productId,
      },
    },
  })
}

export async function listWishlists(
  params: WishlistFilterParams = {}
): Promise<
  PaginatedResult<Prisma.WishlistGetPayload<{ include: { _count: true } }>>
> {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    userId,
    isPublic,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.WishlistWhereInput = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  if (userId) where.userId = userId
  if (isPublic !== undefined) where.isPublic = isPublic

  const [total, data] = await Promise.all([
    db.wishlist.count({ where }),
    db.wishlist.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { items: true } },
      },
    }),
  ])

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  } as unknown as PaginatedResult<
    Prisma.WishlistGetPayload<{ include: { _count: true } }>
  >
}
