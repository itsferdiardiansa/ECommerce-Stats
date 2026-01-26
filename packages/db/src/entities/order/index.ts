import { db } from '@/libs/prisma'
import { Prisma } from '../../../prisma/generated'

export async function createOrder(data: Prisma.OrderCreateInput) {
  return db.order.create({ data })
}

export async function getOrderById(id: number) {
  return db.order.findUnique({ where: { id } })
}

export async function updateOrder(id: number, data: Prisma.OrderUpdateInput) {
  return db.order.update({ where: { id }, data })
}

export async function deleteOrder(id: number) {
  return db.order.delete({ where: { id } })
}

export async function listOrders(params: Prisma.OrderFindManyArgs = {}) {
  return db.order.findMany(params)
}
