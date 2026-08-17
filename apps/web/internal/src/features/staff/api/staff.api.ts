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
  description: string | null
  isSystem: boolean
  permissions: string[]
  memberCount: number
}

export interface PermissionRow {
  key: string
  description: string | null
}

export interface RoleMember {
  id: string
  email: string
  name: string | null
  isSuperAdmin: boolean
}

export interface AuditEntry {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  metadata: unknown
  actorEmail: string | null
  actorName: string | null
  createdAt: string
}

export interface StaffListParams {
  search?: string
  status?: string
  role?: string
  page: number
  pageSize: number
}

export interface StaffListResult {
  items: StaffRow[]
  total: number
}

export interface AuditListParams {
  search?: string
  action?: string
  targetType?: string
  page: number
  pageSize: number
}

export interface AuditListResult {
  items: AuditEntry[]
  total: number
}

export interface AuditFilterOptions {
  actions: string[]
  targetTypes: string[]
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface InvitationRow {
  id: string
  email: string
  name: string
  status: InvitationStatus
  roleKeys: string[]
  expiresAt: string
  resentAt: string | null
  resendCount: number
  acceptedAt: string | null
  rejectedAt: string | null
  staffAccountId: string | null
  invitedByEmail: string | null
  invitedByName: string | null
  createdAt: string
}

export interface InvitationListParams {
  search?: string
  status?: string
  page: number
  pageSize: number
}

export interface InvitationListResult {
  items: InvitationRow[]
  total: number
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

export interface RoleInput {
  key: string
  name: string
  description?: string
  permissionKeys: string[]
}

export interface RoleUpdate {
  name?: string
  description?: string
  permissionKeys?: string[]
}

export const staffApi = {
  list(token: string, params: StaffListParams, signal?: AbortSignal) {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.status && params.status !== 'ALL')
      qs.set('status', params.status)
    if (params.role && params.role !== 'ALL') qs.set('role', params.role)
    qs.set('page', String(params.page))
    qs.set('pageSize', String(params.pageSize))
    return apiFetch<StaffListResult>(`/staff?${qs.toString()}`, {
      token,
      signal,
    })
  },
  roles(token: string, signal?: AbortSignal) {
    return apiFetch<RoleRow[]>('/staff/roles', { token, signal })
  },
  permissions(token: string, signal?: AbortSignal) {
    return apiFetch<PermissionRow[]>('/staff/permissions', { token, signal })
  },
  roleMembers(token: string, roleKey: string, signal?: AbortSignal) {
    return apiFetch<RoleMember[]>(`/staff/roles/${roleKey}/members`, {
      token,
      signal,
    })
  },
  audit(token: string, params: AuditListParams, signal?: AbortSignal) {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.action && params.action !== 'ALL')
      qs.set('action', params.action)
    if (params.targetType && params.targetType !== 'ALL')
      qs.set('targetType', params.targetType)
    qs.set('page', String(params.page))
    qs.set('pageSize', String(params.pageSize))
    return apiFetch<AuditListResult>(`/staff/audit?${qs.toString()}`, {
      token,
      signal,
    })
  },
  auditFilters(token: string, signal?: AbortSignal) {
    return apiFetch<AuditFilterOptions>('/staff/audit/filters', {
      token,
      signal,
    })
  },
  invitations(
    token: string,
    params: InvitationListParams,
    signal?: AbortSignal
  ) {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.status && params.status !== 'ALL')
      qs.set('status', params.status)
    qs.set('page', String(params.page))
    qs.set('pageSize', String(params.pageSize))
    return apiFetch<InvitationListResult>(
      `/staff/invitations?${qs.toString()}`,
      { token, signal }
    )
  },
  resendInvitation(token: string, id: string, signal?: AbortSignal) {
    return apiFetch<{ success: boolean }>(`/staff/invitations/${id}/resend`, {
      method: 'POST',
      token,
      signal,
    })
  },
  cancelInvitation(token: string, id: string, signal?: AbortSignal) {
    return apiFetch<{ success: boolean }>(`/staff/invitations/${id}`, {
      method: 'DELETE',
      token,
      signal,
    })
  },
  invite(token: string, body: InviteInput, signal?: AbortSignal) {
    return apiFetch<InviteResult>('/staff', {
      method: 'POST',
      token,
      json: body,
      signal,
    })
  },
  createRole(token: string, body: RoleInput, signal?: AbortSignal) {
    return apiFetch<RoleRow>('/staff/roles', {
      method: 'POST',
      token,
      json: body,
      signal,
    })
  },
  updateRole(
    token: string,
    roleKey: string,
    body: RoleUpdate,
    signal?: AbortSignal
  ) {
    return apiFetch<RoleRow>(`/staff/roles/${roleKey}`, {
      method: 'PATCH',
      token,
      json: body,
      signal,
    })
  },
  deleteRole(token: string, roleKey: string, signal?: AbortSignal) {
    return apiFetch<{ success: boolean }>(`/staff/roles/${roleKey}`, {
      method: 'DELETE',
      token,
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
  removeRole(
    token: string,
    staffId: string,
    roleKey: string,
    signal?: AbortSignal
  ) {
    return apiFetch<{ success: boolean }>(
      `/staff/${staffId}/roles/${roleKey}`,
      {
        method: 'DELETE',
        token,
        signal,
      }
    )
  },
}
