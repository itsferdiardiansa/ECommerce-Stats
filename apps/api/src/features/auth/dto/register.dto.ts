import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z
    .string({ error: 'common.validation.required' })
    .email({ message: 'common.validation.email' }),
  username: z
    .string({ error: 'common.validation.required' })
    .min(3, { message: 'common.validation.minLength' }),
  password: z
    .string({ error: 'common.validation.required' })
    .min(8, { message: 'common.validation.minLength' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'common.validation.password_pattern',
    }),
  name: z
    .string({ error: 'common.validation.required' })
    .min(3, { message: 'common.validation.minLength' }),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, { message: 'common.validation.phone_pattern' })
    .optional(),
  avatar: z.string().url({ message: 'common.validation.url' }).optional(),
})

export class RegisterDto extends createZodDto(RegisterSchema) {}
