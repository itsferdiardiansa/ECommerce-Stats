import { z } from 'zod'

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Paste the reset code from your email.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(
        passwordPattern,
        'Include upper & lower case, a number, and a symbol (@$!%*?&).'
      ),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine(v => v.password === v.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
