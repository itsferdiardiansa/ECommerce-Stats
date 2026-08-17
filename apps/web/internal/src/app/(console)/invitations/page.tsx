import type { Metadata } from 'next'
import { InvitationsList } from '@/features/staff/components/InvitationsList'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Invitations' }

export default function InvitationsPage() {
  return (
    <PermissionGate permission="staff.view">
      <InvitationsList />
    </PermissionGate>
  )
}
