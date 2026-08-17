'use client'

import { useMemo, useState } from 'react'
import { useDebouncedValue } from '@rufieltics/ui'
import { useQueryClient, useServerTable } from '@rufieltics/query'
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
    ? (table.items.find(r => r.id === accessId) ?? null)
    : null
  const permissionKeys = useMemo(
    () => permissions.map(p => p.key),
    [permissions]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Staff</h1>
          <p className="text-muted-foreground text-sm">
            Manage platform staff accounts.
          </p>
        </div>
        {has('staff.manage') ? (
          <InviteStaffDialog onInvited={invalidateStaff} />
        ) : null}
      </div>

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

      <StaffAccessDrawer
        staff={accessStaff}
        roles={roles}
        permissionKeys={permissionKeys}
        token={token}
        onOpenChange={open => setAccessId(open ? accessId : null)}
      />
    </div>
  )
}
