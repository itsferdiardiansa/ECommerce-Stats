import { z } from 'zod'

export const inviteStaffSchema = z.object({
  email: z.email('Enter a valid email address'),
})
export type InviteStaffValues = z.infer<typeof inviteStaffSchema>
