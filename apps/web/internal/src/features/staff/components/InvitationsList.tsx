'use client'

import { useState } from 'react'
import {
  DataTable,
  useDebouncedValue,
  type DataTableColumn,
} from '@rufieltics/ui'
import { useQueryClient, useServerTable } from '@rufieltics/query'
import { useAuth } from '@/features/auth/context'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import { staffApi, staffKeys, type InvitationRow } from '@/features/staff/api'
import { invitationColumns } from '@/features/staff/configs/invitations'
import {
  InvitationFilters,
  type InvitationFilterState,
} from './InvitationFilters'
import { InvitationRowActions } from './InvitationRowActions'

const INITIAL_FILTERS: InvitationFilterState = { search: '', status: 'ALL' }
const MIN_SEARCH = 3

export function InvitationsList() {
  const { token } = useAuth()
  const { has } = usePermissions()
  const canManage = has('staff.manage')
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<InvitationFilterState>(INITIAL_FILTERS)

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const search =
    debouncedSearch.trim().length >= MIN_SEARCH ? debouncedSearch.trim() : ''

  const table = useServerTable<InvitationRow>({
    queryKey: staffKeys.invitations({ search, status: filters.status }),
    fetcher: (page, signal) =>
      token
        ? staffApi.invitations(
            token,
            { ...page, search, status: filters.status },
            signal
          )
        : Promise.resolve({ items: [], total: 0 }),
    enabled: !!token,
  })

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['staff', 'invitations'] })

  const columns: DataTableColumn<InvitationRow>[] = canManage
    ? [
        ...invitationColumns,
        {
          id: 'actions',
          header: '',
          width: 'w-0',
          align: 'right',
          cell: row => (
            <InvitationRowActions row={row} token={token} onChanged={refresh} />
          ),
        },
      ]
    : invitationColumns

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Invitations</h1>
        <p className="text-muted-foreground text-sm">
          Track invitation status - pending, accepted, rejected and expired.
        </p>
      </div>

      <DataTable
        variant="card"
        columns={columns}
        data={table.items}
        rowKey={row => row.id}
        loading={table.status === 'pending'}
        error={table.error}
        onRetry={table.reload}
        onRefetch={table.reload}
        isRefetching={table.isRefetching}
        pagination={table.pagination}
        emptyMessage="No invitations match these filters."
        errorTitle="Couldn't load invitations"
        toolbar={<InvitationFilters value={filters} onChange={setFilters} />}
      />
    </div>
  )
}
