import { z } from 'zod'

export const personalDetailsSchema = z.object({
  bio: z.string().max(500, 'Bio must be 500 characters or fewer.'),
  birthDate: z
    .string()
    .refine(
      v => v === '' || !Number.isNaN(Date.parse(v)),
      'Enter a valid date.'
    ),
  gender: z.string(),
})

export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>
