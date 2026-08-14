import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SetupSchema = z.object({
  inviteToken: z.string().min(1),
  password: z.string().min(12),
})

export const ConfirmSetupSchema = z.object({
  inviteToken: z.string().min(1),
  code: z.string().min(6).max(8),
})

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const MfaSchema = z.object({
  mfaToken: z.string().min(1),
  code: z.string().min(6).max(8),
})

export const TotpResetRequestSchema = z.object({
  email: z.email(),
})

export const TotpResetBeginSchema = z.object({
  token: z.string().min(1),
})

export const TotpResetConfirmSchema = z.object({
  token: z.string().min(1),
  code: z.string().min(6).max(8),
})

export class SetupDto extends createZodDto(SetupSchema) {}
export class ConfirmSetupDto extends createZodDto(ConfirmSetupSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class MfaDto extends createZodDto(MfaSchema) {}
export class TotpResetRequestDto extends createZodDto(TotpResetRequestSchema) {}
export class TotpResetBeginDto extends createZodDto(TotpResetBeginSchema) {}
export class TotpResetConfirmDto extends createZodDto(TotpResetConfirmSchema) {}
