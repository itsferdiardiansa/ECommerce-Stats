import { z } from 'zod'

export const addressSchema = z.object({
  label: z.string().max(80, 'Label must be 80 characters or fewer.'),
  type: z.enum(['shipping', 'billing']),
  street1: z
    .string()
    .min(1, 'Street address is required.')
    .max(200, 'Street address is too long.'),
  street2: z.string().max(200, 'This field is too long.'),
  city: z.string().min(1, 'City is required.').max(100, 'City is too long.'),
  state: z
    .string()
    .min(1, 'State or province is required.')
    .max(100, 'This field is too long.'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required.')
    .max(20, 'Postal code is too long.'),
  country: z
    .string()
    .min(2, 'Country is required.')
    .max(100, 'Country is too long.'),
  phone: z
    .string()
    .refine(
      v => v === '' || /^\+?[0-9\s()-]{7,20}$/.test(v),
      'Enter a valid phone number.'
    ),
  isDefault: z.boolean(),
})

export type AddressValues = z.infer<typeof addressSchema>
