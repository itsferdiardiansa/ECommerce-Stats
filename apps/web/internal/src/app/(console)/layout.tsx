'use client'

import { type ReactNode } from 'react'
import { DashboardShell, Spinner } from '@rufieltics/ui'
import { QueryProvider } from '@rufieltics/core/client'
import { useConsoleShell } from '@/features/console/hooks/useConsoleShell'
import {
  BreadcrumbScope,
  ScopedBreadcrumb,
} from '@/features/console/components/BreadcrumbScope'
import { ConsoleHeaderActions } from '@/features/console/components/ConsoleHeaderActions'

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const {
    isBootstrapping,
    navGroups,
    section,
    breadcrumbs,
    user,
    handleSignOut,
  } = useConsoleShell()

  if (isBootstrapping) {
    return (
      <DashboardShell appName="Rufieltics" navGroups={[]} loading>
        <Spinner fill />
      </DashboardShell>
    )
  }

  return (
    <QueryProvider>
      <BreadcrumbScope>
        <DashboardShell
          appName="Rufieltics"
          navGroups={navGroups}
          section={section}
          user={user}
          breadcrumb={<ScopedBreadcrumb base={breadcrumbs} />}
          headerActions={<ConsoleHeaderActions />}
          onSignOut={handleSignOut}
        >
          {children}
        </DashboardShell>
      </BreadcrumbScope>
    </QueryProvider>
  )
}
