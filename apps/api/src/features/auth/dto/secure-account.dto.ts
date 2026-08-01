import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SecureAccountSchema = z.object({
  token: z
    .string({ error: 'common.validation.required' })
    .min(32, { message: 'common.validation.required' }),
})

export class SecureAccountDto extends createZodDto(SecureAccountSchema) {}
