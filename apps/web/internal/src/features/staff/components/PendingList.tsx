'use client'

import {
  Badge,
  Card,
  CardContent,
  FormError,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rufieltics/ui'
import { useStaff } from '@/features/staff/hooks/useStaff'

export function PendingList() {
  const { rows, loading, error } = useStaff()
  const pending = rows.filter(r => r.status === 'INVITED')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pending status</h1>
        <p className="text-muted-foreground text-sm">
          Invited staff who have not finished setting up their account.
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
                  <TableHead>Name</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>{row.name ?? '-'}</TableCell>
                    <TableCell>
                      {new Date(row.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">invited</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {pending.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      No pending invitations.
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
