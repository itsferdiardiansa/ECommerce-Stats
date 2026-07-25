import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const StepUpSchema = z.object({
  challengeId: z
    .string({ error: 'common.validation.required' })
    .uuid({ message: 'common.validation.uuid' }),
  code: z.string({ error: 'common.validation.required' }).min(6).max(32),
  method: z.enum(['email', 'totp', 'recovery'], {
    error: 'common.validation.required',
  }),
  trustDevice: z.boolean().optional(),
})

export class StepUpDto extends createZodDto(StepUpSchema) {}
