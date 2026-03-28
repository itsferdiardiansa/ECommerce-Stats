import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const UpdateUserSchema = z.object({
  username: z.string().min(3).optional(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
      error: 'common.validation.password_pattern',
    })
    .optional(),
  name: z.string().min(3).optional(),
  avatar: z.string().url({ error: 'common.validation.url' }).nullish(),
})

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
