'use client'

import { SidebarInset, SidebarTrigger } from '@/components/layout/sidebar'
import { SidebarProvider } from '@/components/layout/sidebar'
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
  breadcrumb,
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

      <SidebarInset className="overflow-hidden md:my-2 md:mr-2 md:ml-2 md:rounded-md md:border">
        <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1 md:hidden" />
          {breadcrumb ? (
            <div className="min-w-0 flex-1">{breadcrumb}</div>
          ) : null}
          <div className="ml-auto flex items-center gap-2">{headerActions}</div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
