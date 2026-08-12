import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'common.validation.minLength' })
    .optional(),
  avatar: z.string().nullish(),
})

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
