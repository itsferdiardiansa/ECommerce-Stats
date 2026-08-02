import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Password changes go through POST /auth/password (sudo-guarded).
export const UpdateUserSchema = z.object({
  username: z.string().min(3).optional(),
  name: z.string().min(3).optional(),
  phone: z.string().nullish(),
  avatar: z.string().nullish(),
})

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
