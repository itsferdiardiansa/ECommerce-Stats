import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SendPhoneVerificationSchema = z.object({
  phone: z
    .string({ error: 'common.validation.required' })
    .regex(/^\+[1-9]\d{1,14}$/, { message: 'common.validation.phone_pattern' }),
})

export class SendPhoneVerificationDto extends createZodDto(
  SendPhoneVerificationSchema
) {}
