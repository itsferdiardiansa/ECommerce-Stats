import { z } from 'zod'

const code = z
  .string()
  .min(6, 'Enter the 6-digit code')
  .max(8, 'Code is too long')

export const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  code,
})
export type SignInValues = z.infer<typeof signInSchema>

export const resetTotpSchema = z.object({ code })
export type ResetTotpValues = z.infer<typeof resetTotpSchema>

export const setupSchema = z
  .object({
    password: z.string().min(12, 'Use at least 12 characters'),
    confirm: z.string().min(1, 'Confirm your password'),
    code,
  })
  .refine(value => value.password === value.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })
export type SetupValues = z.infer<typeof setupSchema>
