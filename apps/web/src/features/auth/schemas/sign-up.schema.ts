import { z } from 'zod'

// Mirrors the API RegisterDto password rule so client + server errors agree.
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

export const signUpSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters.'),
    username: z.string().min(3, 'Username must be at least 3 characters.'),
    email: z
      .string()
      .min(1, 'Email is required.')
      .email('Enter a valid email.'),
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

export type SignUpValues = z.infer<typeof signUpSchema>
