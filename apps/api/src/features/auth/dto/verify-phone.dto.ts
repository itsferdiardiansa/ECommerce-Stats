import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const VerifyPhoneSchema = z.object({
  phone: z
    .string({ error: 'common.validation.required' })
    .regex(/^\+[1-9]\d{1,14}$/, { message: 'common.validation.phone_pattern' }),
  code: z
    .string({ error: 'common.validation.required' })
    .length(6, { message: 'auth.validation.code_length' })
    .regex(/^\d{6}$/, { message: 'auth.validation.code_numeric' }),
})

export class VerifyPhoneDto extends createZodDto(VerifyPhoneSchema) {}
