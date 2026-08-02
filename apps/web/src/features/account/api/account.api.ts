import { apiFetch } from '@/lib/api-client'

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

export interface MfaStatus {
  totp: {
    enabled: boolean
    pending: boolean
    confirmedAt: string | null
    lastUsedAt: string | null
  }
  passkeys: { enabled: boolean; count: number }
  recoveryCodesRemaining: number
}

export interface SessionInfo {
  id: string
  isCurrent: boolean
  ipAddress: string | null
  browser: string | null
  os: string | null
  deviceType: 'desktop' | 'mobile' | 'tablet'
  deviceName: string | null
  location: string | null
  createdAt: string
  lastUsedAt: string | null
  expires: string
}

export interface Profile {
  id: number
  email: string
  username: string
  name: string
  avatar: string | null
  phone: string | null
  emailVerifiedAt: string | null
  isTwoFactorEnabled: boolean
  createdAt: string
  organization: {
    id: string
    name: string
    role: string
    memberCount: number
  } | null
}

export const accountApi = {
  getMe: (token: string) =>
    apiFetch<Profile>('/auth/me', { headers: auth(token) }),

  updateProfile: (
    token: string,
    id: number,
    data: {
      name?: string
      username?: string
      phone?: string | null
      avatar?: string | null
    }
  ) =>
    apiFetch<unknown>(`/users/${id}`, {
      method: 'PUT',
      headers: auth(token),
      body: JSON.stringify(data),
    }),

  requestEmailChange: (token: string, newEmail: string) =>
    apiFetch<unknown>('/auth/email/change', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ newEmail }),
    }),

  confirmEmailChange: (token: string, code: string) =>
    apiFetch<unknown>('/auth/email/change/confirm', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ code }),
    }),

  sudoPassword: (token: string, password: string) =>
    apiFetch<{ expiresIn: number }>('/auth/sudo', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ method: 'password', password }),
    }),

  sudoStatus: (token: string) =>
    apiFetch<{ active: boolean; expiresIn: number }>('/auth/sudo', {
      headers: auth(token),
    }),

  changePassword: (token: string, password: string) =>
    apiFetch<null>('/auth/password', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ password }),
    }),

  mfaStatus: (token: string) =>
    apiFetch<MfaStatus>('/auth/mfa', { headers: auth(token) }),

  totpBegin: (token: string) =>
    apiFetch<{ secret: string; otpauthUri: string }>('/auth/mfa/totp', {
      method: 'POST',
      headers: auth(token),
    }),

  totpConfirm: (token: string, code: string) =>
    apiFetch<{ recoveryCodes: string[] }>('/auth/mfa/totp/confirm', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ code }),
    }),

  totpDisable: (token: string) =>
    apiFetch<null>('/auth/mfa/totp', {
      method: 'DELETE',
      headers: auth(token),
    }),

  regenerateRecoveryCodes: (token: string) =>
    apiFetch<{ recoveryCodes: string[] }>('/auth/mfa/recovery-codes', {
      method: 'POST',
      headers: auth(token),
    }),

  listSessions: (token: string) =>
    apiFetch<SessionInfo[]>('/auth/sessions', { headers: auth(token) }),

  revokeSession: (token: string, id: string) =>
    apiFetch<unknown>('/auth/sessions', {
      method: 'DELETE',
      headers: auth(token),
      body: JSON.stringify({ jtis: [id] }),
    }),

  revokeOtherSessions: (token: string) =>
    apiFetch<unknown>('/auth/sessions/others', {
      method: 'DELETE',
      headers: auth(token),
    }),
}
