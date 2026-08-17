import { Badge, type DataTableColumn } from '@rufieltics/ui'
import type { AuditEntry } from '@/features/staff/api'

export const auditColumns: DataTableColumn<AuditEntry>[] = [
  {
    id: 'when',
    header: 'When',
    cell: row => (
      <span className="whitespace-nowrap">
        {new Date(row.createdAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </span>
    ),
  },
  {
    id: 'actor',
    header: 'Actor',
    cell: row => row.actorName ?? row.actorEmail ?? 'System',
  },
  {
    id: 'action',
    header: 'Action',
    cell: row => (
      <Badge variant="outline" className="font-mono">
        {row.action}
      </Badge>
    ),
  },
  {
    id: 'target',
    header: 'Target',
    cell: row =>
      row.targetType
        ? `${row.targetType}${row.targetId ? ` · ${row.targetId.slice(0, 8)}` : ''}`
        : '-',
  },
  {
    id: 'details',
    header: 'Details',
    cell: row =>
      row.metadata ? (
        <code className="text-muted-foreground text-xs">
          {JSON.stringify(row.metadata)}
        </code>
      ) : (
        '-'
      ),
  },
]
