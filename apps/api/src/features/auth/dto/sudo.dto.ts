import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SudoSchema = z
  .object({
    method: z.enum(['password', 'totp']).default('password'),
    password: z.string().optional(),
    code: z.string().optional(),
  })
  .refine(v => (v.method === 'totp' ? !!v.code : !!v.password), {
    message: 'common.validation.required',
    path: ['password'],
  })

export class SudoDto extends createZodDto(SudoSchema) {}
