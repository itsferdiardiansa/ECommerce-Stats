import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import {
  CouponFilterParams,
  CreateCouponInput,
  UpdateCouponInput,
} from './types'
import { PaginatedResult } from '@/types/filters'

export async function createCoupon(data: CreateCouponInput) {
  return db.coupon.create({ data })
}

export async function getCouponById(id: number) {
  return db.coupon.findUnique({ where: { id } })
}

export async function getCouponByCode(code: string) {
  return db.coupon.findUnique({ where: { code } })
}

export async function updateCoupon(id: number, data: UpdateCouponInput) {
  return db.coupon.update({ where: { id }, data })
}

export async function deleteCoupon(id: number) {
  return db.coupon.delete({ where: { id } })
}

export async function listCoupons(
  params: CouponFilterParams = {}
): Promise<PaginatedResult<Prisma.CouponGetPayload<object>>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    code,
    isActive,
    discountType,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.CouponWhereInput = {}

  if (code) where.code = { equals: code }
  if (isActive !== undefined) where.isActive = isActive
  if (discountType) where.discountType = discountType

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, data] = await Promise.all([
    db.coupon.count({ where }),
    db.coupon.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
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
  }
}
