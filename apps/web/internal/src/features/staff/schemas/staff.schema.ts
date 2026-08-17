import { z } from 'zod'

export const inviteStaffSchema = z.object({
  email: z.email('Enter a valid email address'),
})
export type InviteStaffValues = z.infer<typeof inviteStaffSchema>

export const roleFormSchema = z.object({
  key: z
    .string()
    .min(2, 'At least 2 characters')
    .max(40, 'Keep it under 40 characters')
    .regex(/^[a-z][a-z0-9_]*$/, 'Lowercase letters, numbers and underscores'),
  name: z.string().min(2, 'Give the role a name').max(60, 'Name is too long'),
  description: z.string().max(200, 'Keep it under 200 characters').optional(),
})
export type RoleFormValues = z.infer<typeof roleFormSchema>
