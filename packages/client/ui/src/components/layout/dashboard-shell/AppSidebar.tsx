'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/sidebar'
import { SidebarNav, SidebarNavSkeleton } from './SidebarNav'
import { SidebarUser, SidebarUserSkeleton } from './SidebarUser'
import type { DashboardNavGroup, DashboardUser } from './types'

export function AppSidebar({
  appName,
  groups,
  homeHref = '/',
  user,
  onSignOut,
  loading = false,
}: {
  appName: string
  groups: DashboardNavGroup[]
  homeHref?: string
  user?: DashboardUser
  onSignOut?: () => void
  loading?: boolean
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <a href={homeHref} className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
            R
          </div>
          <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
            {appName}
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent>
        {loading ? <SidebarNavSkeleton /> : <SidebarNav groups={groups} />}
      </SidebarContent>

      <SidebarFooter>
        {loading ? (
          <SidebarUserSkeleton />
        ) : (
          <SidebarUser user={user} onSignOut={onSignOut} />
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
