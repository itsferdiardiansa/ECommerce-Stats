import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ error: 'common.validation.required' })
    .email({ message: 'common.validation.email' }),
})

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
