import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import { CreateUserInput, UpdateUserInput, UserFilterParams } from './types'
import { PaginatedResult } from '@/types/filters'

export async function createUser(data: CreateUserInput) {
  if (!data?.email || !data.email.includes('@')) {
    throw new Error('Invalid email address')
  }
  return db.user.create({
    data,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isActive: true,
      isStaff: true,
      isTwoFactorEnabled: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  })
}

export async function getUserById(id: number) {
  return db.user.findFirst({
    where: {
      id,
      deletedAt: null, // Exclude soft-deleted users
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isActive: true,
      isStaff: true,
      isTwoFactorEnabled: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      addresses: true,
      orders: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function getUserByEmail(email: string) {
  return db.user.findFirst({
    where: {
      email,
      deletedAt: null, // Exclude soft-deleted users
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isActive: true,
      isStaff: true,
      isTwoFactorEnabled: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      passwordHash: true, // Needed for authentication
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  })
}

/**
 * Check if email exists in database (including soft-deleted users)
 * Used for registration validation
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const count = await db.user.count({
    where: { email },
  })
  return count > 0
}

/**
 * Get user by email (including soft-deleted users)
 * Used for registration validation to check deleted status
 */
export async function getUserByEmailIncludingDeleted(email: string) {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      deletedAt: true,
    },
  })
}

/**
 * Check if username exists in database (including soft-deleted users)
 * Used for registration validation
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const count = await db.user.count({
    where: { username },
  })
  return count > 0
}

/**
 * Get user by username (including soft-deleted users)
 * Used for registration validation to check deleted status
 */
export async function getUserByUsernameIncludingDeleted(username: string) {
  return db.user.findUnique({
    where: { username },
    select: {
      id: true,
      email: true,
      username: true,
      deletedAt: true,
    },
  })
}

export async function updateUser(id: number, data: UpdateUserInput) {
  return db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isActive: true,
      isStaff: true,
      isTwoFactorEnabled: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  })
}

export async function deleteUser(id: number) {
  // Soft delete: set deletedAt timestamp instead of hard delete
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isActive: true,
      isStaff: true,
      isTwoFactorEnabled: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // If already deleted, return as-is (DELETE is idempotent)
  if (user.deletedAt) {
    return user
  }

  // Perform soft delete
  return db.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false, // Also deactivate the user
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isActive: true,
      isStaff: true,
      isTwoFactorEnabled: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  })
}

export async function listUsers(params: UserFilterParams = {}): Promise<
  PaginatedResult<
    Prisma.UserGetPayload<{
      select: {
        id: true
        email: true
        username: true
        name: true
        avatar: true
        phone: true
        emailVerifiedAt: true
        phoneVerifiedAt: true
        isActive: true
        isStaff: true
        isTwoFactorEnabled: true
        lastLoginAt: true
        passwordChangedAt: true
        createdAt: true
        updatedAt: true
        deletedAt: true
      }
    }>
  >
> {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    email,
    name,
    isActive,
    isStaff,
    isTwoFactorEnabled,
    marketingOptIn,
    tierLevel,
    includeDeleted = false,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  const skip = (safePage - 1) * safeLimit

  const where: Prisma.UserWhereInput = {}

  if (!includeDeleted) {
    where.deletedAt = null
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (email) where.email = { contains: email, mode: 'insensitive' }
  if (name) where.name = { contains: name, mode: 'insensitive' }
  if (isActive !== undefined) where.isActive = isActive
  if (isStaff !== undefined) where.isStaff = isStaff
  if (isTwoFactorEnabled !== undefined)
    where.isTwoFactorEnabled = isTwoFactorEnabled

  if (marketingOptIn !== undefined || tierLevel) {
    where.profile = {}
    if (marketingOptIn !== undefined)
      where.profile.marketingOptIn = marketingOptIn
    if (tierLevel) where.profile.tierLevel = tierLevel
  }

  const [total, data] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isActive: true,
        isStaff: true,
        isTwoFactorEnabled: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
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
  }
}
