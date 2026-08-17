'use client'

import { type ReactNode } from 'react'
import { DashboardShell, Spinner } from '@rufieltics/ui'
import { QueryProvider } from '@rufieltics/query'
import { useConsoleShell } from '@/features/console'

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const { isBootstrapping, navGroups, user, handleSignOut } = useConsoleShell()

  if (isBootstrapping) {
    return (
      <DashboardShell appName="Rufieltics Admin" navGroups={[]} loading>
        <Spinner fill />
      </DashboardShell>
    )
  }

  return (
    <QueryProvider>
      <DashboardShell
        appName="Rufieltics Admin"
        navGroups={navGroups}
        user={user}
        onSignOut={handleSignOut}
      >
        {children}
      </DashboardShell>
    </QueryProvider>
  )
}
