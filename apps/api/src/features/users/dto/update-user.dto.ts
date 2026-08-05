import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Password changes go through POST /auth/password (sudo-guarded).
export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'common.validation.minLength' })
    .regex(/^[a-zA-Z0-9._-]+$/, { message: 'common.validation.pattern' })
    .optional(),
  name: z
    .string()
    .min(3, { message: 'common.validation.minLength' })
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s()-]{7,20}$/, {
      message: 'common.validation.phone_pattern',
    })
    .nullish(),
  avatar: z.string().nullish(),
})

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
