import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ResetPasswordSchema = z.object({
  token: z
    .string({ error: 'common.validation.required' })
    .min(32, { message: 'common.validation.required' }),
  password: z
    .string({ error: 'common.validation.required' })
    .min(8, { message: 'common.validation.minLength' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'common.validation.password_pattern',
    }),
})

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}

export const VerifyResetTokenSchema = z.object({
  token: z.string({ error: 'common.validation.required' }).min(1),
})

export class VerifyResetTokenDto extends createZodDto(VerifyResetTokenSchema) {}
