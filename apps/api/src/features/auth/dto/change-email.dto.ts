import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const RequestEmailChangeSchema = z.object({
  newEmail: z
    .string({ error: 'common.validation.required' })
    .email({ message: 'common.validation.email' }),
})

export class RequestEmailChangeDto extends createZodDto(
  RequestEmailChangeSchema
) {}

export const ConfirmEmailChangeSchema = z.object({
  code: z
    .string({ error: 'common.validation.required' })
    .length(6, { message: 'auth.validation.code_length' })
    .regex(/^\d{6}$/, { message: 'auth.validation.code_numeric' }),
})

export class ConfirmEmailChangeDto extends createZodDto(
  ConfirmEmailChangeSchema
) {}
