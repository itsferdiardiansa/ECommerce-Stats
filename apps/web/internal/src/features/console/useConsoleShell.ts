'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/context'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import { resolveNavGroups } from './navigation'

export function useConsoleShell() {
  const { status, staff, logout } = useAuth()
  const { has } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/sign-in')
  }, [status, router])

  const navGroups = useMemo(
    () => resolveNavGroups(pathname, has),
    [pathname, has]
  )

  const user = useMemo(
    () => (staff ? { name: staff.name, email: staff.email } : undefined),
    [staff]
  )

  const handleSignOut = useCallback(async () => {
    await logout()
    router.replace('/sign-in')
  }, [logout, router])

  return {
    isBootstrapping: status !== 'authenticated',
    navGroups,
    user,
    handleSignOut,
  }
}
