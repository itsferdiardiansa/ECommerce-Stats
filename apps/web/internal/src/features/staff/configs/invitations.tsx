import { Badge, type DataTableColumn } from '@rufieltics/ui'
import type { InvitationRow, InvitationStatus } from '@/features/staff/api'

const STATUS_STYLES: Record<
  InvitationStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pending',
    className:
      'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  ACCEPTED: {
    label: 'Accepted',
    className:
      'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    className:
      'border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'border-transparent bg-muted text-muted-foreground',
  },
}

export function InvitationStatusBadge({
  status,
}: {
  status: InvitationStatus
}) {
  const style = STATUS_STYLES[status]
  return <Badge className={style.className}>{style.label}</Badge>
}

const dateFmt = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

export const invitationColumns: DataTableColumn<InvitationRow>[] = [
  {
    id: 'email',
    header: 'Email',
    cell: row => <span className="font-medium">{row.email}</span>,
  },
  { id: 'name', header: 'Name', cell: row => row.name || '-' },
  {
    id: 'status',
    header: 'Status',
    cell: row => <InvitationStatusBadge status={row.status} />,
  },
  {
    id: 'invited',
    header: 'Invited',
    cell: row => dateFmt(row.createdAt),
  },
  {
    id: 'expires',
    header: 'Expires',
    cell: row =>
      row.status === 'PENDING' ? (
        dateFmt(row.expiresAt)
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    id: 'invitedBy',
    header: 'Invited by',
    cell: row => row.invitedByName ?? row.invitedByEmail ?? 'System',
  },
]
