import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z
    .string({ error: 'common.validation.required' })
    .email({ message: 'common.validation.email' }),
  password: z.string({ error: 'common.validation.required' }),
})

export class LoginDto extends createZodDto(LoginSchema) {}
