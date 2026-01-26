import { db } from '@/libs/prisma'
import { Prisma } from '../../../prisma/generated/index.js'

export async function createUser(data: Prisma.UserCreateInput) {
  return db.user.create({ data })
}

export async function getUserById(id: number) {
  return db.user.findUnique({ where: { id } })
}

export async function updateUser(id: number, data: Prisma.UserUpdateInput) {
  return db.user.update({ where: { id }, data })
}

export async function deleteUser(id: number) {
  return db.user.delete({ where: { id } })
}

export async function listUsers(params: Prisma.UserFindManyArgs = {}) {
  return db.user.findMany(params)
}
