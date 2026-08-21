'use client'

import { useResource } from '@rufieltics/core-client'
import { useAuth } from '@/features/auth/context'
import {
  staffApi,
  staffKeys,
  type PermissionRow,
  type RoleRow,
} from '@/features/staff/api'

interface RefData {
  roles: RoleRow[]
  permissions: PermissionRow[]
}

const EMPTY: RefData = { roles: [], permissions: [] }

/**
 * Reference data shared across the staff area (role catalog, filters, access
 * drawer): the full role and permission lists. Small and bounded, so it's
 * fetched whole rather than paged.
 */
export function useStaffRefData() {
  const { token } = useAuth()

  const query = useResource<RefData>(
    staffKeys.refData,
    async signal => {
      if (!token) return EMPTY
      const [roles, permissions] = await Promise.all([
        staffApi.roles(token, signal),
        staffApi.permissions(token, signal),
      ])
      return { roles, permissions }
    },
    { enabled: !!token }
  )

  const data = query.data ?? EMPTY

  return {
    token,
    roles: data.roles,
    permissions: data.permissions,
    status: query.status,
    error: query.error,
    isRefetching: query.isRefetching,
    reload: query.refetch,
  }
}
