import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { UpdateUserSchema } from './update-user.dto'

const AdminUpdateUserSchema = UpdateUserSchema.extend({
  isActive: z.boolean().optional(),
  isStaff: z.boolean().optional(),
  isTwoFactorEnabled: z.boolean().optional(),
})

export class AdminUpdateUserDto extends createZodDto(AdminUpdateUserSchema) {}
