import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

const ListLoginLockoutsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['active', 'cleared', 'all']).optional().default('active'),
  email: z.string().email().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export class ListLoginLockoutsDto extends createZodDto(
  ListLoginLockoutsSchema
) {}
