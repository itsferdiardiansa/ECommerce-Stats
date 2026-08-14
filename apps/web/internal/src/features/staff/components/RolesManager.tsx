'use client'

import {
  Badge,
  Card,
  CardContent,
  FormError,
  SelectField,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@rufieltics/ui'
import { useAuth } from '@/features/auth/context'
import { staffApi } from '@/features/staff/api'
import { sortSuperFirst, useStaff } from '@/features/staff/hooks/useStaff'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'

export function RolesManager() {
  const { token } = useAuth()
  const { rows, roles, loading, error, reload } = useStaff()
  const nextSignal = useAbortSignal()

  const assignRole = async (staffId: string, roleKey: string) => {
    if (!token) return
    try {
      await staffApi.assignRole(token, staffId, roleKey, nextSignal())
      toast.success('Role assigned')
      reload()
    } catch (e) {
      if (isSilentError(e)) return
      toast.error(e instanceof Error ? e.message : 'Failed to assign role')
    }
  }

  const handleAssign = (staffId: string) => (roleKey: string) => {
    void assignRole(staffId, roleKey)
  }

  const assignable = sortSuperFirst(rows).filter(r => !r.isSuperAdmin)
  const roleOptions = roles.map(r => ({ value: r.key, label: r.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Set roles</h1>
        <p className="text-muted-foreground text-sm">
          Grant staff members a role to scope their access.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <FormError message={error} />
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Current roles</TableHead>
                  <TableHead className="w-52">Assign role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignable.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.roles.length ? (
                          row.roles.map(rk => (
                            <Badge key={rk} variant="outline">
                              {rk}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SelectField
                        className="w-48"
                        placeholder="Add a role"
                        options={roleOptions}
                        onChange={handleAssign(row.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {assignable.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      No assignable staff yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
