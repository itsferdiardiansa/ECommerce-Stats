import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const CreateAddressSchema = z.object({
  label: z.string().max(80).nullish(),
  type: z.enum(['shipping', 'billing']).default('shipping'),
  street1: z
    .string()
    .min(1, { message: 'common.validation.required' })
    .max(200),
  street2: z.string().max(200).nullish(),
  city: z.string().min(1, { message: 'common.validation.required' }).max(100),
  state: z.string().min(1, { message: 'common.validation.required' }).max(100),
  postalCode: z
    .string()
    .min(1, { message: 'common.validation.required' })
    .max(20),
  country: z
    .string()
    .min(2, { message: 'common.validation.required' })
    .max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9\s()-]{7,20}$/, {
      message: 'common.validation.phone_pattern',
    })
    .nullish(),
  isDefault: z.boolean().optional(),
})

export const UpdateAddressSchema = CreateAddressSchema.partial()

export class CreateAddressDto extends createZodDto(CreateAddressSchema) {}
export class UpdateAddressDto extends createZodDto(UpdateAddressSchema) {}
