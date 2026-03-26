import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

const ListLocksoutsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['active', 'cleared', 'all']).optional().default('active'),
  email: z.string().email().optional(),
  reason: z
    .enum(['TOO_MANY_ATTEMPTS', 'SUSPICIOUS_ACTIVITY', 'MANUAL_LOCK'])
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z
    .enum(['lockedAt', 'expires', 'email'])
    .optional()
    .default('lockedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export class ListLocksoutsDto extends createZodDto(ListLocksoutsSchema) {}
