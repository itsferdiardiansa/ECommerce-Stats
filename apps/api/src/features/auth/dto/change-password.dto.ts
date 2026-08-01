import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ChangePasswordSchema = z.object({
  password: z
    .string({ error: 'common.validation.required' })
    .min(8, { message: 'common.validation.minLength' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'common.validation.password_pattern',
    }),
})

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
