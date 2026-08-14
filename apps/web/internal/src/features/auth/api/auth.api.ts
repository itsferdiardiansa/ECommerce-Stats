import { apiFetch } from '@/lib/api-client'

export interface StaffProfile {
  id: string
  email: string
  name: string | null
  isSuperAdmin: boolean
  status: string
  permissions: string[]
}

export interface LoginResult {
  mfaRequired: boolean
  enrollRequired: boolean
  mfaToken: string
  otpauthUri?: string
  secret?: string
}

export const authApi = {
  setup(inviteToken: string, password: string, signal?: AbortSignal) {
    return apiFetch<{ otpauthUri: string; secret: string }>(
      '/staff/auth/setup',
      { method: 'POST', json: { inviteToken, password }, signal }
    )
  },
  confirmSetup(inviteToken: string, code: string, signal?: AbortSignal) {
    return apiFetch<{ activated: boolean }>('/staff/auth/setup/confirm', {
      method: 'POST',
      json: { inviteToken, code },
      signal,
    })
  },
  login(email: string, password: string, signal?: AbortSignal) {
    return apiFetch<LoginResult>('/staff/auth/login', {
      method: 'POST',
      json: { email, password },
      signal,
    })
  },
  verifyMfa(mfaToken: string, code: string, signal?: AbortSignal) {
    return apiFetch<{ accessToken: string; expiresIn: number }>(
      '/staff/auth/mfa',
      { method: 'POST', json: { mfaToken, code }, signal }
    )
  },
  requestTotpReset(email: string, signal?: AbortSignal) {
    return apiFetch<{ requested: boolean }>('/staff/auth/totp/reset-request', {
      method: 'POST',
      json: { email },
      signal,
    })
  },
  beginTotpReset(token: string, signal?: AbortSignal) {
    return apiFetch<{ otpauthUri: string; secret: string }>(
      '/staff/auth/totp/reset/begin',
      { method: 'POST', json: { token }, signal }
    )
  },
  confirmTotpReset(token: string, code: string, signal?: AbortSignal) {
    return apiFetch<{ reset: boolean }>('/staff/auth/totp/reset/confirm', {
      method: 'POST',
      json: { token, code },
      signal,
    })
  },
  me(token: string, signal?: AbortSignal) {
    return apiFetch<StaffProfile>('/staff/auth/me', { token, signal })
  },
  logout(token: string) {
    return apiFetch<{ success: boolean }>('/staff/auth/logout', {
      method: 'POST',
      token,
    })
  },
}
