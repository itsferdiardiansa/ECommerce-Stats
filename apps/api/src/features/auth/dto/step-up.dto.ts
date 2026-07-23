import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const StepUpSchema = z.object({
  challengeId: z
    .string({ error: 'common.validation.required' })
    .uuid({ message: 'common.validation.uuid' }),
  code: z
    .string({ error: 'common.validation.required' })
    .length(6, { message: 'auth.validation.code_length' })
    .regex(/^\d{6}$/, { message: 'auth.validation.code_numeric' }),
})

export class StepUpDto extends createZodDto(StepUpSchema) {}
