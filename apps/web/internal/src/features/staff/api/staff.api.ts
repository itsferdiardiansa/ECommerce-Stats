import { apiFetch } from '@/lib/api-client'

export interface StaffRow {
  id: string
  email: string
  name: string | null
  isSuperAdmin: boolean
  status: string
  roles: string[]
  lastLoginAt: string | null
  createdAt: string
}

export interface RoleRow {
  id: string
  key: string
  name: string
  description: string
  isSystem: boolean
  permissions: string[]
}

export interface InviteInput {
  email: string
  name: string
  roleKeys?: string[]
}

export interface InviteResult {
  staffId: string
  email: string
  inviteToken: string
  setupUrl: string
}

export const staffApi = {
  list(token: string, signal?: AbortSignal) {
    return apiFetch<StaffRow[]>('/staff', { token, signal })
  },
  roles(token: string, signal?: AbortSignal) {
    return apiFetch<RoleRow[]>('/staff/roles', { token, signal })
  },
  invite(token: string, body: InviteInput, signal?: AbortSignal) {
    return apiFetch<InviteResult>('/staff', {
      method: 'POST',
      token,
      json: body,
      signal,
    })
  },
  assignRole(
    token: string,
    staffId: string,
    roleKey: string,
    signal?: AbortSignal
  ) {
    return apiFetch<{ success: boolean }>(`/staff/${staffId}/roles`, {
      method: 'POST',
      token,
      json: { roleKey },
      signal,
    })
  },
}
