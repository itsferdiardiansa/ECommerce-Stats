'use client'

import type { ChangeEvent } from 'react'
import { Input, SelectField, type SelectFieldOption } from '@rufieltics/ui'
import type { RoleRow } from '@/features/staff/api'

export interface StaffFilterState {
  search: string
  status: string
  role: string
}

const STATUS_OPTIONS: SelectFieldOption[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export function StaffFilters({
  value,
  onChange,
  roles,
}: {
  value: StaffFilterState
  onChange: (next: StaffFilterState) => void
  roles: RoleRow[]
}) {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, search: event.target.value })
  }

  const handleStatus = (status: string) => {
    onChange({ ...value, status })
  }

  const handleRole = (role: string) => {
    onChange({ ...value, role })
  }

  const roleOptions: SelectFieldOption[] = [
    { value: 'ALL', label: 'All roles' },
    { value: '__super', label: 'Super admin' },
    ...roles.map(role => ({ value: role.key, label: role.name })),
  ]

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search name or email…"
        value={value.search}
        onChange={handleSearch}
        className="sm:max-w-xs"
      />
      <SelectField
        className="sm:w-40"
        value={value.status}
        onChange={handleStatus}
        options={STATUS_OPTIONS}
      />
      <SelectField
        className="sm:w-44"
        value={value.role}
        onChange={handleRole}
        options={roleOptions}
      />
    </div>
  )
}
