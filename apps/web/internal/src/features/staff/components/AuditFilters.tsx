'use client'

import type { ChangeEvent } from 'react'
import { Input, SelectField, type SelectFieldOption } from '@rufieltics/ui'

export interface AuditFilterState {
  search: string
  action: string
  targetType: string
}

export function AuditFilters({
  value,
  onChange,
  actions,
  targetTypes,
}: {
  value: AuditFilterState
  onChange: (next: AuditFilterState) => void
  actions: string[]
  targetTypes: string[]
}) {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, search: event.target.value })
  }

  const actionOptions: SelectFieldOption[] = [
    { value: 'ALL', label: 'All actions' },
    ...actions.map(action => ({ value: action, label: action })),
  ]

  const targetOptions: SelectFieldOption[] = [
    { value: 'ALL', label: 'All targets' },
    ...targetTypes.map(targetType => ({
      value: targetType,
      label: targetType,
    })),
  ]

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search actor, action or target…"
        value={value.search}
        onChange={handleSearch}
        className="sm:max-w-xs"
      />
      <SelectField
        className="sm:w-52"
        value={value.action}
        onChange={action => onChange({ ...value, action })}
        options={actionOptions}
      />
      <SelectField
        className="sm:w-44"
        value={value.targetType}
        onChange={targetType => onChange({ ...value, targetType })}
        options={targetOptions}
      />
    </div>
  )
}
