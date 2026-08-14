import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const InviteStaffSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  roleKeys: z.array(z.string()).optional(),
})

export const AssignRoleSchema = z.object({
  roleKey: z.string().min(1),
})

export class InviteStaffDto extends createZodDto(InviteStaffSchema) {}
export class AssignRoleDto extends createZodDto(AssignRoleSchema) {}
