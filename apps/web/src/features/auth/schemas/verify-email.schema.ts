import { z } from 'zod'

export const verifyEmailSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email.'),
  code: z
    .string()
    .length(6, 'Enter the 6-digit code.')
    .regex(/^\d{6}$/, 'The code must be 6 digits.'),
})

export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>
