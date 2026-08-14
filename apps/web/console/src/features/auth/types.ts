export interface AuthUser {
  email: string
  name?: string | null
}

export interface LoginRequest {
  email: string
  password: string
  captchaToken?: string
}

export interface RegisterRequest {
  name: string
  username: string
  email: string
  password: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  retryAfterSeconds: number
  throttled: boolean
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface SessionResponse {
  accessToken: string
  expiresIn: number
}

export interface StepUpResponse {
  stepUpRequired: true
  challengeId: string
  method: string
  availableMethods: string[]
}

export type LoginResponse = SessionResponse | StepUpResponse

export function isStepUp(res: LoginResponse): res is StepUpResponse {
  return 'stepUpRequired' in res
}

export type StepUpMethod = 'email' | 'totp' | 'recovery' | 'passkey'

export interface StepUpRequest {
  challengeId: string
  code: string
  method: 'email' | 'totp' | 'recovery'
}

export interface PasskeySummary {
  id: string
  name: string | null
  deviceType: string
  backedUp: boolean
  aaguid: string | null
  transports: string[]
  createdAt: string
  lastUsedAt: string | null
  lastUsedDevice: string | null
}
