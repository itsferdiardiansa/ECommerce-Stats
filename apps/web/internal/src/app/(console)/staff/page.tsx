import type { Metadata } from 'next'
import { StaffList } from '@/features/staff/components/StaffList'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Staff' }

export default function StaffPage() {
  return (
    <PermissionGate permission="staff.view">
      <StaffList />
    </PermissionGate>
  )
}
