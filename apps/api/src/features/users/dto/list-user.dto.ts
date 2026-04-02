import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Prisma } from '@rufieltics/db'

const ListUserSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),

  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'email',
      'name',
      'username',
      'lastLoginAt',
    ])
    .default('createdAt')
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),

  search: z.string().optional(),

  email: z.string().optional(),
  name: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
  isStaff: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
  isTwoFactorEnabled: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
  marketingOptIn: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
  tierLevel: z.enum(Prisma.TierLevel).optional(),
  includeDeleted: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
})

export class ListUserDto extends createZodDto(ListUserSchema) {}
