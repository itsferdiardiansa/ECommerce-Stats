import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const UpdateUserSchema = z.object({
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
  isActive: z.boolean().optional(),
  isStaff: z.boolean().optional(),
  isTwoFactorEnabled: z.boolean().optional(),
})

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
