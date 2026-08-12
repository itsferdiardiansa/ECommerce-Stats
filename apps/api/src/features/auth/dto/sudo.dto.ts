import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SudoSchema = z
  .object({
    method: z.enum(['password', 'totp', 'passkey']).default('password'),
    password: z.string().optional(),
    code: z.string().optional(),
    response: z.unknown().optional(),
  })
  .refine(
    v => {
      if (v.method === 'totp') return !!v.code
      if (v.method === 'passkey') return !!v.response
      return !!v.password
    },
    {
      message: 'common.validation.required',
      path: ['password'],
    }
  )
  .refine(v => v.method !== 'totp' || !v.code || /^\d{6}$/.test(v.code), {
    message: 'auth.validation.code_numeric',
    path: ['code'],
  })

export class SudoDto extends createZodDto(SudoSchema) {}
