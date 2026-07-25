import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ConfirmTotpSchema = z.object({
  code: z
    .string({ error: 'common.validation.required' })
    .length(6, { message: 'auth.validation.code_length' })
    .regex(/^\d{6}$/, { message: 'auth.validation.code_numeric' }),
})

export class ConfirmTotpDto extends createZodDto(ConfirmTotpSchema) {}
