'use client'

import type { ChangeEvent } from 'react'
import { Input, SelectField, type SelectFieldOption } from '@rufieltics/ui'

export interface InvitationFilterState {
  search: string
  status: string
}

const STATUS_OPTIONS: SelectFieldOption[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
]

export function InvitationFilters({
  value,
  onChange,
}: {
  value: InvitationFilterState
  onChange: (next: InvitationFilterState) => void
}) {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, search: event.target.value })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search email or name…"
        value={value.search}
        onChange={handleSearch}
        className="sm:max-w-xs"
      />
      <SelectField
        className="sm:w-44"
        value={value.status}
        onChange={status => onChange({ ...value, status })}
        options={STATUS_OPTIONS}
      />
    </div>
  )
}
