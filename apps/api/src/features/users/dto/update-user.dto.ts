import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const UpdateUserSchema = z.object({
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
