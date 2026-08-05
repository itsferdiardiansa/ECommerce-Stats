import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const registrationResponse = z
  .object({
    id: z.string(),
    rawId: z.string(),
    type: z.literal('public-key'),
    response: z
      .object({
        clientDataJSON: z.string(),
        attestationObject: z.string(),
        transports: z.array(z.string()).optional(),
      })
      .passthrough(),
  })
  .passthrough()

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

export const VerifyPasskeyRegistrationSchema = z.object({
  response: registrationResponse,
  name: z.string().trim().max(60).optional(),
})

export const VerifyPasskeyLoginSchema = z.object({
  challengeId: z.string({ error: 'common.validation.required' }).uuid(),
  response: authenticationResponse,
  trustDevice: z.boolean().optional().default(false),
})

export const PasskeyOptionsSchema = z.object({
  challengeId: z.string({ error: 'common.validation.required' }).uuid(),
})

export const RenamePasskeySchema = z.object({
  name: z.string().trim().min(1).max(60),
})

export const BeginPasskeyRegistrationSchema = z.object({
  attachment: z.enum(['platform', 'cross-platform']).optional(),
})

export class VerifyPasskeyRegistrationDto extends createZodDto(
  VerifyPasskeyRegistrationSchema
) {}
export class VerifyPasskeyLoginDto extends createZodDto(
  VerifyPasskeyLoginSchema
) {}
export class PasskeyOptionsDto extends createZodDto(PasskeyOptionsSchema) {}
export class RenamePasskeyDto extends createZodDto(RenamePasskeySchema) {}
export class BeginPasskeyRegistrationDto extends createZodDto(
  BeginPasskeyRegistrationSchema
) {}
