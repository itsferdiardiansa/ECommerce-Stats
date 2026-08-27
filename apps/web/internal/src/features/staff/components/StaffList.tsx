'use client'

import { useMemo, useState } from 'react'
import {
  DashboardContentShell,
  SectionShell,
  useDebouncedValue,
} from '@rufieltics/ui'
import { useQueryClient, useServerTable } from '@rufieltics/core/client'
import { staffApi, staffKeys } from '@/features/staff/api'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import { useStaffRefData } from '@/features/staff/hooks/useStaffRefData'
import { InviteStaffDialog } from './InviteStaffDialog'
import { StaffAccessDrawer } from './StaffAccessDrawer'
import { StaffFilters, type StaffFilterState } from './StaffFilters'
import { StaffTable } from './StaffTable'

const INITIAL_FILTERS: StaffFilterState = {
  search: '',
  status: 'ALL',
  role: 'ALL',
}

const MIN_SEARCH = 3

export function StaffList() {
  const { token, roles, permissions } = useStaffRefData()
  const { has } = usePermissions()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<StaffFilterState>(INITIAL_FILTERS)
  const [accessId, setAccessId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const search =
    debouncedSearch.trim().length >= MIN_SEARCH ? debouncedSearch.trim() : ''

  const table = useServerTable({
    queryKey: staffKeys.list({
      search,
      status: filters.status,
      role: filters.role,
    }),
    fetcher: (page, signal) =>
      token
        ? staffApi.list(
            token,
            { ...page, search, status: filters.status, role: filters.role },
            signal
          )
        : Promise.resolve({ items: [], total: 0 }),
    enabled: !!token,
  })

  const invalidateStaff = () =>
    queryClient.invalidateQueries({ queryKey: staffKeys.all })

  const accessStaff = accessId
    ? (table.items.find(item => item.id === accessId) ?? null)
    : null
  const permissionKeys = useMemo(
    () => permissions.map(permission => permission.key),
    [permissions]
  )

  return (
    <DashboardContentShell
      title="Staff"
      subTitle="Manage platform staff accounts."
      actions={
        has('staff.manage') ? (
          <InviteStaffDialog onInvited={invalidateStaff} />
        ) : undefined
      }
    >
      <SectionShell>
        <StaffTable
          data={table.items}
          loading={table.status === 'pending'}
          error={table.error}
          isRefetching={table.isRefetching}
          onRetry={table.reload}
          onManageAccess={row => setAccessId(row.id)}
          pagination={table.pagination}
          toolbar={
            <StaffFilters value={filters} onChange={setFilters} roles={roles} />
          }
        />
      </SectionShell>

      <StaffAccessDrawer
        staff={accessStaff}
        roles={roles}
        permissionKeys={permissionKeys}
        token={token}
        onOpenChange={open => setAccessId(open ? accessId : null)}
      />
    </DashboardContentShell>
  )
}
