'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, FormError } from '@rufieltics/ui'
import { sortSuperFirst, useStaff } from '@/features/staff/hooks/useStaff'
import { InviteStaffDialog } from './InviteStaffDialog'
import { StaffFilters, type StaffFilterState } from './StaffFilters'
import { StaffTable } from './StaffTable'

const INITIAL_FILTERS: StaffFilterState = {
  search: '',
  status: 'ALL',
  role: 'ALL',
}

export function StaffList() {
  const { rows, roles, loading, error, reload } = useStaff()
  const [filters, setFilters] = useState<StaffFilterState>(INITIAL_FILTERS)

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return sortSuperFirst(rows).filter(r => {
      const matchQuery =
        !q ||
        r.email.toLowerCase().includes(q) ||
        (r.name ?? '').toLowerCase().includes(q)
      const matchStatus =
        filters.status === 'ALL' || r.status === filters.status
      const matchRole =
        filters.role === 'ALL' ||
        (filters.role === '__super'
          ? r.isSuperAdmin
          : r.roles.includes(filters.role))
      return matchQuery && matchStatus && matchRole
    })
  }, [rows, filters])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Staff</h1>
          <p className="text-muted-foreground text-sm">
            Manage platform staff accounts.
          </p>
        </div>
        <InviteStaffDialog onInvited={reload} />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <StaffFilters value={filters} onChange={setFilters} roles={roles} />
          <FormError message={error} />
          <StaffTable rows={filtered} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
