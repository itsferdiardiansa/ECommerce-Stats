'use client'

import type { ReactNode } from 'react'
import {
  Badge,
  Button,
  DataTable,
  Popover,
  PopoverContent,
  PopoverTrigger,
  type DataTableColumn,
  type PaginationState,
} from '@rufieltics/ui'
import { SlidersHorizontal } from 'lucide-react'
import type { StaffRow } from '@/features/staff/api'

const MAX_VISIBLE_ROLES = 2

function RoleBadges({ roles }: { roles: string[] }) {
  const visible = roles.slice(0, MAX_VISIBLE_ROLES)
  const hidden = roles.slice(MAX_VISIBLE_ROLES)

  return (
    <div className="flex flex-nowrap items-center gap-1">
      {visible.map(rk => (
        <Badge key={rk} variant="secondary" className="max-w-32 truncate">
          {rk}
        </Badge>
      ))}
      {hidden.length ? (
        <Popover>
          <PopoverTrigger asChild>
            <Badge variant="secondary" className="cursor-pointer">
              +{hidden.length}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="flex w-auto max-w-56 flex-wrap gap-1 p-2">
            {roles.map(rk => (
              <Badge key={rk} variant="secondary">
                {rk}
              </Badge>
            ))}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

interface StaffTableProps {
  data: StaffRow[]
  loading: boolean
  error?: string | null
  isRefetching?: boolean
  onRetry?: () => void
  onManageAccess: (row: StaffRow) => void
  toolbar?: ReactNode
  pagination?: PaginationState | false
}

export function StaffTable({
  data,
  loading,
  error,
  isRefetching,
  onRetry,
  onManageAccess,
  toolbar,
  pagination,
}: StaffTableProps) {
  const columns: DataTableColumn<StaffRow>[] = [
    {
      id: 'email',
      header: 'Email',
      cell: row => <span className="font-medium">{row.email}</span>,
    },
    {
      id: 'name',
      header: 'Name',
      cell: row => row.name ?? '-',
    },
    {
      id: 'status',
      header: 'Status',
      cell: row => (
        <Badge variant={row.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {row.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'roles',
      header: 'Roles',
      cell: row =>
        row.isSuperAdmin ? (
          <Badge variant="outline">super-admin</Badge>
        ) : row.roles.length ? (
          <RoleBadges roles={row.roles} />
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      id: 'access',
      header: 'Access',
      width: 'w-0',
      align: 'right',
      cell: row => (
        <Button variant="ghost" size="sm" onClick={() => onManageAccess(row)}>
          <SlidersHorizontal className="size-4" />
          Manage
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      variant="card"
      columns={columns}
      data={data}
      rowKey={row => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isRefetching={isRefetching}
      toolbar={toolbar}
      pagination={pagination}
      emptyMessage="No staff match your filters."
      errorTitle="Couldn't load staff"
    />
  )
}
