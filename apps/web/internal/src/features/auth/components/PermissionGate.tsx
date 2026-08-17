'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { usePermissions } from '@/features/auth/hooks/usePermissions'

/**
 * Renders `children` only when the staff member holds `permission`; otherwise
 * redirects back to the console home. Lives inside the authed console shell, so
 * the staff profile (and its permissions) is already loaded when this runs.
 */
export function PermissionGate({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const { has } = usePermissions()
  const router = useRouter()
  const allowed = has(permission)

  useEffect(() => {
    if (!allowed) router.replace('/')
  }, [allowed, router])

  if (!allowed) return null
  return <>{children}</>
}
