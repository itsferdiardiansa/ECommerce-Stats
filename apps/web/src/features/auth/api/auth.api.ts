import { apiFetch } from '@/lib/api-client'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SessionResponse,
  StepUpRequest,
  VerifyEmailRequest,
} from '../types'

export const authApi = {
  register: (body: RegisterRequest) =>
    apiFetch<unknown>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: LoginRequest) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  refresh: () => apiFetch<SessionResponse>('/auth/refresh', { method: 'POST' }),

  logout: (accessToken: string) =>
    apiFetch<unknown>('/auth/logout', {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }),

  verifyEmail: (body: VerifyEmailRequest) =>
    apiFetch<unknown>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resendVerification: (email: string) =>
    apiFetch<unknown>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (body: ForgotPasswordRequest) =>
    apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: ResetPasswordRequest) =>
    apiFetch<unknown>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  secureAccount: (body: { token: string }) =>
    apiFetch<null>('/auth/secure-account', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // --- step-up (second factor) completion ---
  stepUp: (body: StepUpRequest) =>
    apiFetch<SessionResponse>('/auth/login/step-up', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  passkeyLoginOptions: (challengeId: string) =>
    apiFetch<PublicKeyCredentialRequestOptionsJSON>(
      '/auth/login/passkey/options',
      { method: 'POST', body: JSON.stringify({ challengeId }) }
    ),

  passkeyLoginVerify: (body: {
    challengeId: string
    response: AuthenticationResponseJSON
    trustDevice?: boolean
  }) =>
    apiFetch<SessionResponse>('/auth/login/passkey/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // --- passwordless (discoverable / conditional UI) ---
  passkeyDiscoverOptions: () =>
    apiFetch<{
      challengeId: string
      options: PublicKeyCredentialRequestOptionsJSON
    }>('/auth/login/passkey/discover', { method: 'POST' }),

  passkeyDiscoverVerify: (body: {
    challengeId: string
    response: AuthenticationResponseJSON
  }) =>
    apiFetch<SessionResponse>('/auth/login/passkey/authenticate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
