import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SudoSchema = z.object({
  method: z.literal('password').default('password'),
  password: z.string({ error: 'common.validation.required' }),
})

export class SudoDto extends createZodDto(SudoSchema) {}
