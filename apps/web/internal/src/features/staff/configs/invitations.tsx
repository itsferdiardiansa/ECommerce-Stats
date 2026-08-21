import { Badge, TONE, type DataTableColumn, type Tone } from '@rufieltics/ui'
import type { InvitationRow, InvitationStatus } from '@/features/staff/api'

const STATUS_STYLES: Record<InvitationStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'destructive' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
}

export function InvitationStatusBadge({
  status,
}: {
  status: InvitationStatus
}) {
  const style = STATUS_STYLES[status]
  return <Badge className={TONE[style.tone].soft}>{style.label}</Badge>
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
