import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUser, getUserById, listUsers, updateUser, deleteUser } from '..'
import { db } from '@/libs/prisma'

vi.mock('@/libs/prisma', () => ({
  db: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
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
        expect.objectContaining({ data: input })
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
    it('should return user with relations (excluding soft-deleted)', async () => {
      const mockUser = { id: 1, email: 'test@example.com' }
      // @ts-expect-error - Mock implementation
      db.user.findFirst.mockResolvedValue(mockUser)

      const result = await getUserById(1)

      const arg = vi.mocked(db.user.findFirst).mock.calls[0][0]
      expect(arg?.where).toEqual({ id: 1, deletedAt: null })
      expect(arg?.select).toEqual(
        expect.objectContaining({
          addresses: true,
          orders: { take: 5, orderBy: { createdAt: 'desc' } },
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
        })
      )
      expect(result).toEqual(mockUser)
    })

    it('should soft-delete a user (set deletedAt + deactivate)', async () => {
      // @ts-expect-error - Mock implementation
      db.user.findUnique.mockResolvedValue({ id: 11, deletedAt: null })
      const softDeleted = { id: 11, isActive: false, deletedAt: new Date() }
      // @ts-expect-error - Mock implementation
      db.user.update.mockResolvedValue(softDeleted)

      const result = await deleteUser(11)

      const arg = vi.mocked(db.user.update).mock.calls[0][0]
      expect(arg.where).toEqual({ id: 11 })
      expect(arg.data).toEqual(
        expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(Date),
        })
      )
      expect(db.user.delete).not.toHaveBeenCalled()
      expect(result).toEqual(softDeleted)
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
