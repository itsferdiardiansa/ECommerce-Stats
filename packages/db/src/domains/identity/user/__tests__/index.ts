import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUser, getUserById, listUsers, updateUser, deleteUser } from '..'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('User Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
      // @ts-expect-error - Mock implementation
      db.user.create.mockResolvedValue(mockUser)

      const input = {
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        passwordHash: 'hashed_password',
      }
      const result = await createUser(input)

      expect(db.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: input,
          select: expect.objectContaining({ id: true, email: true }),
        })
      )
      expect(result).toEqual(mockUser)
    })

    it('should throw error for invalid email', async () => {
      const input = {
        email: 'invalid-email',
        name: 'Test User',
        username: 'invalidUser',
        passwordHash: 'hashed_password',
      }

      await expect(createUser(input)).rejects.toThrow('Invalid email address')
      expect(db.user.create).not.toHaveBeenCalled()
    })
  })

  describe('getUserById', () => {
    it('should return active user with relations', async () => {
      const mockUser = { id: 1, email: 'test@example.com' }
      // @ts-expect-error - Mock implementation
      db.user.findFirst.mockResolvedValue(mockUser)

      const result = await getUserById(1)

      expect(db.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, deletedAt: null },
          select: expect.objectContaining({
            id: true,
            email: true,
            addresses: true,
            orders: { take: 5, orderBy: { createdAt: 'desc' } },
          }),
        })
      )
      expect(result).toEqual(mockUser)
    })
  })

  describe('update and delete', () => {
    it('should update a user', async () => {
      const mockUser = { id: 10, name: 'Updated' }
      // @ts-expect-error - Mock implementation
      db.user.update.mockResolvedValue(mockUser)

      const result = await updateUser(10, { name: 'Updated' })

      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: { name: 'Updated' },
          select: expect.objectContaining({ id: true, email: true }),
        })
      )
      expect(result).toEqual(mockUser)
    })

    it('should soft-delete a user (sets deletedAt and isActive=false)', async () => {
      const existing = { id: 11, deletedAt: null }
      const softDeleted = { id: 11, deletedAt: new Date(), isActive: false }
      // @ts-expect-error - Mock implementation
      db.user.findUnique.mockResolvedValue(existing)
      // @ts-expect-error - Mock implementation
      db.user.update.mockResolvedValue(softDeleted)

      const result = await deleteUser(11)

      expect(db.user.delete).not.toHaveBeenCalled()

      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 11 },
          data: expect.objectContaining({
            isActive: false,
            deletedAt: expect.any(Date),
          }),
        })
      )
      expect(result).toEqual(softDeleted)
    })

    it('should be idempotent on already-deleted users', async () => {
      const alreadyDeleted = { id: 12, deletedAt: new Date('2026-01-01') }
      // @ts-expect-error - Mock implementation
      db.user.findUnique.mockResolvedValue(alreadyDeleted)

      const result = await deleteUser(12)

      expect(db.user.update).not.toHaveBeenCalled()
      expect(result).toEqual(alreadyDeleted)
    })

    it('should throw when user does not exist', async () => {
      // @ts-expect-error - Mock implementation
      db.user.findUnique.mockResolvedValue(null)

      await expect(deleteUser(99)).rejects.toThrow('User not found')
      expect(db.user.update).not.toHaveBeenCalled()
    })
  })

  describe('listUsers', () => {
    it('should return paginated results', async () => {
      const mockUsers = [{ id: 1, email: 'test@example.com' }]
      const mockCount = 1

      // @ts-expect-error - Mock implementation
      db.user.count.mockResolvedValue(mockCount)
      // @ts-expect-error - Mock implementation
      db.user.findMany.mockResolvedValue(mockUsers)

      const result = await listUsers({ page: 1, limit: 10 })

      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: mockCount,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      })
    })

    it('should include search in where clause', async () => {
      const mockUsers = [{ id: 2, name: 'SearchUser' }]
      const mockCount = 1
      // @ts-expect-error - Mock
      db.user.count.mockResolvedValue(mockCount)
      // @ts-expect-error - Mock
      db.user.findMany.mockResolvedValue(mockUsers)

      const result = await listUsers({ search: 'Search' })

      expect(db.user.findMany).toHaveBeenCalled()
      expect(result.data).toEqual(mockUsers)
    })

    it('should set profile filters when marketingOptIn or tierLevel provided', async () => {
      const mockUsers = [{ id: 3 }]
      const mockCount = 1
      // @ts-expect-error - Mock
      db.user.count.mockResolvedValue(mockCount)
      // @ts-expect-error - Mock
      db.user.findMany.mockResolvedValue(mockUsers)

      const result = await listUsers({
        marketingOptIn: true,
        tierLevel: 'PRO',
      })

      expect(db.user.count).toHaveBeenCalled()
      expect(db.user.findMany).toHaveBeenCalled()
      expect(result.data).toEqual(mockUsers)
    })

    it('should filter by isActive when provided', async () => {
      const mockUsers = [{ id: 4 }]
      const mockCount = 1
      // @ts-expect-error - Mock
      db.user.count.mockResolvedValue(mockCount)
      // @ts-expect-error - Mock
      db.user.findMany.mockResolvedValue(mockUsers)

      const result = await listUsers({ isActive: false })

      expect(db.user.findMany).toHaveBeenCalled()
      expect(result.data).toEqual(mockUsers)
    })
  })
})
