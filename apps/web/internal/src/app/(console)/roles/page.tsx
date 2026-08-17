import type { Metadata } from 'next'
import { RolesCatalog } from '@/features/staff/components/RolesCatalog'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export const metadata: Metadata = { title: 'Roles' }

export default function RolesPage() {
  return (
    <PermissionGate permission="roles.manage">
      <RolesCatalog />
    </PermissionGate>
  )
}
