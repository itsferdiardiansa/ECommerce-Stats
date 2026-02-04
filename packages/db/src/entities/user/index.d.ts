import { Prisma } from '../../../prisma/generated/index.js'
export declare function createUser(data: Prisma.UserCreateInput): Promise<{
  name: string | null
  id: number
  email: string
  username: string | null
  passwordHash: string | null
  avatar: string | null
  phone: string | null
  emailVerifiedAt: Date | null
  phoneVerifiedAt: Date | null
  isActive: boolean
  isStaff: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}>
export declare function getUserById(id: number): Promise<{
  name: string | null
  id: number
  email: string
  username: string | null
  passwordHash: string | null
  avatar: string | null
  phone: string | null
  emailVerifiedAt: Date | null
  phoneVerifiedAt: Date | null
  isActive: boolean
  isStaff: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
} | null>
export declare function updateUser(
  id: number,
  data: Prisma.UserUpdateInput
): Promise<{
  name: string | null
  id: number
  email: string
  username: string | null
  passwordHash: string | null
  avatar: string | null
  phone: string | null
  emailVerifiedAt: Date | null
  phoneVerifiedAt: Date | null
  isActive: boolean
  isStaff: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}>
export declare function deleteUser(id: number): Promise<{
  name: string | null
  id: number
  email: string
  username: string | null
  passwordHash: string | null
  avatar: string | null
  phone: string | null
  emailVerifiedAt: Date | null
  phoneVerifiedAt: Date | null
  isActive: boolean
  isStaff: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}>
export declare function listUsers(params?: Prisma.UserFindManyArgs): Promise<
  {
    name: string | null
    id: number
    email: string
    username: string | null
    passwordHash: string | null
    avatar: string | null
    phone: string | null
    emailVerifiedAt: Date | null
    phoneVerifiedAt: Date | null
    isActive: boolean
    isStaff: boolean
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }[]
>
//# sourceMappingURL=index.d.ts.map
