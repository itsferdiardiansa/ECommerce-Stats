import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const RevokeSessionsSchema = z.object({
  jtis: z.array(z.string().uuid()).min(1),
})

export class RevokeSessionsDto extends createZodDto(RevokeSessionsSchema) {}
