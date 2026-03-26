import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const VerifyEmailSchema = z.object({
  email: z
    .string({ error: 'common.validation.required' })
    .email({ message: 'common.validation.email' }),
  code: z
    .string({ error: 'common.validation.required' })
    .length(6, { message: 'auth.validation.code_length' })
    .regex(/^\d{6}$/, { message: 'auth.validation.code_numeric' }),
})

export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}
