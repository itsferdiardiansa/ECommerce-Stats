import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
})

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
