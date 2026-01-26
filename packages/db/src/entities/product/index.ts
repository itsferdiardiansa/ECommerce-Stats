import { db } from '@/libs/prisma'
import { Prisma } from '../../../prisma/generated'

export async function createProduct(data: Prisma.ProductCreateInput) {
  return db.product.create({ data })
}

export async function getProductById(id: number) {
  return db.product.findUnique({ where: { id } })
}

export async function updateProduct(
  id: number,
  data: Prisma.ProductUpdateInput
) {
  return db.product.update({ where: { id }, data })
}

export async function deleteProduct(id: number) {
  return db.product.delete({ where: { id } })
}

export async function listProducts(params: Prisma.ProductFindManyArgs = {}) {
  return db.product.findMany(params)
}
