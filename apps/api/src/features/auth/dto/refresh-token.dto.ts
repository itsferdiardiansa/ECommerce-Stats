import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const RefreshTokenSchema = z.object({
  refreshToken: z.string({ error: 'common.validation.required' }),
})

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
