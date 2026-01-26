import { db } from '@/libs/prisma'
import { Prisma } from '../../../prisma/generated'

export async function createReview(data: Prisma.ProductReviewCreateInput) {
  return db.productReview.create({ data })
}

export async function getReviewById(id: number) {
  return db.productReview.findUnique({ where: { id } })
}

export async function updateReview(
  id: number,
  data: Prisma.ProductReviewUpdateInput
) {
  return db.productReview.update({ where: { id }, data })
}

export async function deleteReview(id: number) {
  return db.productReview.delete({ where: { id } })
}

export async function listReviews(
  params: Prisma.ProductReviewFindManyArgs = {}
) {
  return db.productReview.findMany(params)
}
