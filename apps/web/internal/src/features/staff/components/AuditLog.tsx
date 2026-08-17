'use client'

import { useState } from 'react'
import { DataTable, useDebouncedValue } from '@rufieltics/ui'
import { useResource, useServerTable } from '@rufieltics/query'
import { useAuth } from '@/features/auth/context'
import {
  staffApi,
  staffKeys,
  type AuditEntry,
  type AuditFilterOptions,
} from '@/features/staff/api'
import { auditColumns } from '@/features/staff/configs/audit'
import { AuditFilters, type AuditFilterState } from './AuditFilters'

const INITIAL_FILTERS: AuditFilterState = {
  search: '',
  action: 'ALL',
  targetType: 'ALL',
}

const MIN_SEARCH = 3

export function AuditLog() {
  const { token } = useAuth()
  const [filters, setFilters] = useState<AuditFilterState>(INITIAL_FILTERS)

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const search =
    debouncedSearch.trim().length >= MIN_SEARCH ? debouncedSearch.trim() : ''

  const options = useResource<AuditFilterOptions>(
    staffKeys.auditFilters,
    signal =>
      token
        ? staffApi.auditFilters(token, signal)
        : Promise.resolve({ actions: [], targetTypes: [] }),
    { enabled: !!token }
  )

  const table = useServerTable<AuditEntry>({
    queryKey: staffKeys.auditList({
      search,
      action: filters.action,
      targetType: filters.targetType,
    }),
    initialPageSize: 20,
    fetcher: (page, signal) =>
      token
        ? staffApi.audit(
            token,
            {
              ...page,
              search,
              action: filters.action,
              targetType: filters.targetType,
            },
            signal
          )
        : Promise.resolve({ items: [], total: 0 }),
    enabled: !!token,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Audit log</h1>
        <p className="text-muted-foreground text-sm">
          Administrative actions across the platform.
        </p>
      </div>

      <DataTable
        variant="card"
        columns={auditColumns}
        data={table.items}
        rowKey={row => row.id}
        loading={table.status === 'pending'}
        error={table.error}
        onRetry={table.reload}
        onRefetch={table.reload}
        isRefetching={table.isRefetching}
        emptyMessage="No audit entries match these filters."
        errorTitle="Couldn't load the audit log"
        pagination={table.pagination}
        toolbar={
          <AuditFilters
            value={filters}
            onChange={setFilters}
            actions={options.data?.actions ?? []}
            targetTypes={options.data?.targetTypes ?? []}
          />
        }
      />
    </div>
  )
}
