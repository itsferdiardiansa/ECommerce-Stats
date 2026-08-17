import type { Metadata } from 'next'
import { AuditLog } from '@/features/staff/components/AuditLog'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Audit log' }

export default function AuditPage() {
  return (
    <PermissionGate permission="audit.view">
      <AuditLog />
    </PermissionGate>
  )
}
