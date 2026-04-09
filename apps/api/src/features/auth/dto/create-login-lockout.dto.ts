import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

const CreateLoginLockoutSchema = z.object({
  email: z.string().email(),
  ttlSeconds: z.coerce.number().int().positive().max(604800).optional(),
  reason: z.literal('MANUAL_LOCK').default('MANUAL_LOCK'),
})

export class CreateLoginLockoutDto extends createZodDto(
  CreateLoginLockoutSchema
) {}
