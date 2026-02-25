import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  email: z
    .string()
    .email({
      message: 'Invalid email address',
    })
    .optional(),
  username: z
    .string()
    .min(3, {
      message: 'Username must be at least 3 characters long',
    })
    .optional(),
  name: z
    .string()
    .min(3, {
      message: 'Name must be at least 3 characters long',
    })
    .optional(),
  passwordHash: z
    .string()
    .min(8, {
      message: 'Password must be at least 8 characters long',
    })
    .optional(),
})

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
