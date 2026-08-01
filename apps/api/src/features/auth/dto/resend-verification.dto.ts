import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ResendVerificationSchema = z.object({
  email: z
    .string({ error: 'common.validation.required' })
    .email({ message: 'common.validation.email' }),
})

export class ResendVerificationDto extends createZodDto(
  ResendVerificationSchema
) {}
