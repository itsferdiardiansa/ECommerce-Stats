import { db } from '@/libs/prisma'
import { createStoreRepository } from './index.js'
import type { ApiOrder, ApiProduct } from './types.js'

const storeRepo = createStoreRepository(db)

export type { ApiOrder, ApiProduct, ApiProductReview } from './types.js'

export async function ensureCategoryId(name?: string) {
  return storeRepo.ensureCategoryId(name)
}

export async function ensureBrandId(name?: string) {
  return storeRepo.ensureBrandId(name)
}

export async function ensureUserId(userId?: number) {
  return storeRepo.ensureUserId(userId)
}

export async function upsertProduct(product: ApiProduct) {
  return storeRepo.upsertProduct(product)
}

export async function upsertOrder(order: ApiOrder) {
  return storeRepo.upsertOrder(order)
}
