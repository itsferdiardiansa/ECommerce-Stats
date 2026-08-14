'use client'

import {
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rufieltics/ui'
import type { StaffRow } from '@/features/staff/api'

export function StaffTable({
  rows,
  loading,
}: {
  rows: StaffRow[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Roles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.email}</TableCell>
            <TableCell>{row.name ?? '-'}</TableCell>
            <TableCell>
              <Badge
                variant={row.status === 'ACTIVE' ? 'default' : 'secondary'}
              >
                {row.status.toLowerCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {row.isSuperAdmin ? (
                  <Badge variant="outline">super-admin</Badge>
                ) : row.roles.length ? (
                  row.roles.map(rk => (
                    <Badge key={rk} variant="outline">
                      {rk}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-muted-foreground py-8 text-center text-sm"
            >
              No staff match your filters.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  )
}
