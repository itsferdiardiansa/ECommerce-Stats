'use client'

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/sidebar'
import { Separator } from '@/components/separator'
import { AppSidebar } from './AppSidebar'
import type { DashboardNavGroup, DashboardShellProps } from './types'

export function DashboardShell({
  appName,
  nav,
  navGroups,
  navLabel = 'Menu',
  homeHref = '/',
  section,
  user,
  headerActions,
  onSignOut,
  loading = false,
  children,
}: DashboardShellProps) {
  const groups: DashboardNavGroup[] =
    navGroups ?? (nav ? [{ label: navLabel, items: nav }] : [])

  return (
    <SidebarProvider>
      <AppSidebar
        appName={appName}
        groups={groups}
        homeHref={homeHref}
        section={section}
        user={user}
        onSignOut={onSignOut}
        loading={loading}
      />

      <SidebarInset>
        <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="ml-auto flex items-center gap-2">{headerActions}</div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
