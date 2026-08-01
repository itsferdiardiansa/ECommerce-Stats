import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const authenticationResponse = z
  .object({
    id: z.string(),
    rawId: z.string(),
    type: z.literal('public-key'),
    response: z
      .object({
        clientDataJSON: z.string(),
        authenticatorData: z.string(),
        signature: z.string(),
        userHandle: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough()

export const PasswordlessAuthSchema = z.object({
  challengeId: z.string({ error: 'common.validation.required' }).uuid(),
  response: authenticationResponse,
})

export class PasswordlessAuthDto extends createZodDto(PasswordlessAuthSchema) {}
