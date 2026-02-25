import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z
    .string('common.validation.required')
    .email({ error: 'common.validation.email' }),
  username: z.string().min(1).min(3),
  password: z
    .string({ error: 'common.validation.required' })
    .min(1)
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
      error: 'common.validation.password_pattern',
    }),
  name: z.string().min(3),
  avatar: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      error: 'common.validation.phone_pattern',
    })
    .optional()
    .nullable(),
  isActive: z.boolean().default(false).optional(),
  isStaff: z.boolean().default(false).optional(),
  isTwoFactorEnabled: z.boolean().default(false).optional(),
})

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
