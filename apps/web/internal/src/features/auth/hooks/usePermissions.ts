'use client'

import { useAuth } from '@/features/auth/context'

/**
 * Permissions of the signed-in staff member. Super-admins implicitly hold every
 * permission. This is UX only - the API guard is the real boundary.
 */
export function usePermissions() {
  const { staff } = useAuth()
  const isSuperAdmin = !!staff?.isSuperAdmin
  const permissions = staff?.permissions ?? []

  const has = (key: string) => isSuperAdmin || permissions.includes(key)

  return { isSuperAdmin, permissions, has }
}
