export interface StaffListFilters {
  search: string
  status: string
  role: string
}

export interface AuditListFilters {
  search: string
  action: string
  targetType: string
}

export interface InvitationListFilters {
  search: string
  status: string
}

export const staffKeys = {
  all: ['staff'] as const,
  refData: ['staff', 'ref-data'] as const,
  list: (filters: StaffListFilters) => ['staff', 'list', filters] as const,
  pending: ['staff', 'list', 'pending'] as const,
  invitations: (filters: InvitationListFilters) =>
    ['staff', 'invitations', filters] as const,
  audit: ['staff', 'audit'] as const,
  auditList: (filters: AuditListFilters) =>
    ['staff', 'audit', 'list', filters] as const,
  auditFilters: ['staff', 'audit', 'filters'] as const,
}
