import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createUserAddress,
  setUserAddressAsDefault,
  getUserAddressById,
  updateUserAddress,
  deleteUserAddress,
  listUserAddresses,
  type CreateUserAddressInput,
} from '../user-address.js'
import { db } from '@/libs/prisma'

// Mock the db client
vi.mock('@/libs/prisma', () => ({
  db: {
    userAddress: {
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(actions => Promise.all(actions)),
  },
}))

describe('User Address Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUserAddress', () => {
    it('should create an address and handle isDefault logic', async () => {
      const mockAddress = { id: 1, street1: '123 Main St', isDefault: true }
      // @ts-expect-error - Mock implementation
      db.userAddress.create.mockResolvedValue(mockAddress)
      // @ts-expect-error - Mock implementation
      db.userAddress.updateMany.mockResolvedValue({ count: 1 })

      const input = {
        street1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: true,
        user: { connect: { id: 1 } },
      }

      const result = await createUserAddress(input)

      expect(db.userAddress.updateMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { isDefault: false },
      })
      expect(db.userAddress.create).toHaveBeenCalledWith({ data: input })
      expect(result).toEqual(mockAddress)
    })

    it('should create an address without checking existing defaults if isDefault is false', async () => {
      const mockAddress = { id: 1, street1: '456 Side St', isDefault: false }
      // @ts-expect-error - Mock implementation
      db.userAddress.create.mockResolvedValue(mockAddress)

      const input = {
        street1: '456 Side St',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        isDefault: false,
        user: { connect: { id: 1 } },
      }

      await createUserAddress(input)

      expect(db.userAddress.updateMany).not.toHaveBeenCalled()
      expect(db.userAddress.create).toHaveBeenCalledWith({ data: input })
    })
  })

  describe('setUserAddressAsDefault', () => {
    it('should use transaction to update defaults', async () => {
      // @ts-expect-error - Mock implementation
      db.userAddress.updateMany.mockResolvedValue({ count: 1 })
      // @ts-expect-error - Mock implementation
      db.userAddress.update.mockResolvedValue({ id: 1, isDefault: true })

      await setUserAddressAsDefault(1, 2)

      expect(db.$transaction).toHaveBeenCalled()
    })
  })

  describe('getUserAddressById', () => {
    it('should return address', async () => {
      const mockAddress = { id: 1, street1: '123 Main St' }
      // @ts-expect-error - Mock implementation
      db.userAddress.findUnique.mockResolvedValue(mockAddress)

      const result = await getUserAddressById(1)

      expect(db.userAddress.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(result).toEqual(mockAddress)
    })
  })

  describe('updateUserAddress', () => {
    it('should update address', async () => {
      const mockAddress = { id: 1, street1: 'Updated St' }
      // @ts-expect-error - Mock implementation
      db.userAddress.update.mockResolvedValue(mockAddress)

      const result = await updateUserAddress(1, { street1: 'Updated St' })

      expect(db.userAddress.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { street1: 'Updated St' },
      })
      expect(result).toEqual(mockAddress)
    })
  })

  describe('deleteUserAddress', () => {
    it('should delete address', async () => {
      const mockAddress = { id: 1 }
      // @ts-expect-error - Mock implementation
      db.userAddress.delete.mockResolvedValue(mockAddress)

      await deleteUserAddress(1)

      expect(db.userAddress.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('listUserAddresses', () => {
    it('should return paginated and filtered results', async () => {
      const mockData = [{ id: 1, street1: '123 Main St' }]
      const mockCount = 1

      // @ts-expect-error - Mock implementation
      db.userAddress.count.mockResolvedValue(mockCount)
      // @ts-expect-error - Mock implementation
      db.userAddress.findMany.mockResolvedValue(mockData)

      const result = await listUserAddresses({
        page: 1,
        limit: 10,
        userId: 1,
        search: 'Main',
      })

      expect(db.userAddress.count).toHaveBeenCalled()
      expect(db.userAddress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            OR: expect.arrayContaining([
              expect.objectContaining({ street1: expect.anything() }),
            ]),
          }),
          take: 10,
          skip: 0,
        })
      )

      expect(result).toEqual({
        data: mockData,
        meta: {
          total: mockCount,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      })
    })

    it('listUserAddresses caps limit and normalizes page', async () => {
      const mockData = []
      const mockCount = 0
      // @ts-expect-error - Mock implementation
      db.userAddress.count.mockResolvedValue(mockCount)
      // @ts-expect-error - Mock implementation
      db.userAddress.findMany.mockResolvedValue(mockData)

      const result = await listUserAddresses({ page: 0, limit: 200 })
      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(100)
      expect(result.data).toEqual(mockData)
    })

    it('listUserAddresses supports type, country and isDefault filters', async () => {
      const mockData = [
        {
          id: 9,
          street1: '789 Home St',
          type: 'HOME',
          country: 'US',
          isDefault: true,
        },
      ]
      const mockCount = 1
      // @ts-expect-error - Mock implementation
      db.userAddress.count.mockResolvedValue(mockCount)
      // @ts-expect-error - Mock implementation
      db.userAddress.findMany.mockResolvedValue(mockData)

      const result = await listUserAddresses({
        type: 'HOME',
        country: 'US',
        isDefault: true,
      })
      expect(db.userAddress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'HOME',
            country: 'US',
            isDefault: true,
          }),
        })
      )
      expect(result.data).toEqual(mockData)
    })

    it('createUserAddress handles connectOrCreate user shape', async () => {
      const mockAddress = { id: 2, street1: '789 New St', isDefault: true }
      // @ts-expect-error - Mock implementation
      db.userAddress.updateMany.mockResolvedValue({ count: 0 })
      // @ts-expect-error - Mock implementation
      db.userAddress.create.mockResolvedValue(mockAddress)

      const input: CreateUserAddressInput = {
        street1: '789 New St',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'US',
        user: {
          connectOrCreate: {
            where: { id: 3 },
            create: {
              email: 'user@example.com',
              name: 'Test User',
              username: 'user3',
              passwordHash: 'hashed_password',
            },
          },
        },
        isDefault: true,
      }

      const result = await createUserAddress(input)
      expect(db.userAddress.updateMany).toHaveBeenCalled()
      expect(db.userAddress.create).toHaveBeenCalledWith({ data: input })
      expect(result).toEqual(mockAddress)
    })
  })
})
