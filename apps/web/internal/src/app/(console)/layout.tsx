'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Clock, ShieldCheck, Users } from 'lucide-react'
import { DashboardShell, type DashboardNavItem } from '@rufieltics/ui'
import { useAuth } from '@/features/auth/context'

const NAV: DashboardNavItem[] = [
  { title: 'Staff', href: '/staff', icon: Users },
  { title: 'Set roles', href: '/roles', icon: ShieldCheck },
  { title: 'Notifications', href: '/notifications', icon: Bell },
  { title: 'Pending status', href: '/pending', icon: Clock },
]

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const { token, staff, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!token) router.replace('/sign-in')
  }, [token, router])

  if (!token) return null

  const nav = NAV.map(item => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }))

  const handleSignOut = async () => {
    await logout()
    router.replace('/sign-in')
  }

  return (
    <DashboardShell
      appName="Rufieltics Admin"
      nav={nav}
      user={staff ? { name: staff.name, email: staff.email } : undefined}
      onSignOut={handleSignOut}
    >
      {children}
    </DashboardShell>
  )
}
