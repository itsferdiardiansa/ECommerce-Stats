'use client'

import { ChevronLeft } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/sidebar'
import { SidebarNav, SidebarNavSkeleton } from './SidebarNav'
import { SidebarUser, SidebarUserSkeleton } from './SidebarUser'
import type {
  DashboardNavGroup,
  DashboardSection,
  DashboardUser,
} from './types'

export function AppSidebar({
  appName,
  groups,
  homeHref = '/',
  section,
  user,
  onSignOut,
  loading = false,
}: {
  appName: string
  groups: DashboardNavGroup[]
  homeHref?: string
  section?: DashboardSection
  user?: DashboardUser
  onSignOut?: () => void
  loading?: boolean
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {section ? (
          <a
            href={section.backHref}
            className="hover:bg-sidebar-accent flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
          >
            <div className="flex size-8 items-center justify-center rounded-md border">
              <ChevronLeft className="size-4" />
            </div>
            <span className="min-w-0 flex-1 truncate font-semibold group-data-[collapsible=icon]:hidden">
              {section.title}
            </span>
          </a>
        ) : (
          <a href={homeHref} className="flex items-center gap-2 px-2 py-1.5">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
              R
            </div>
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              {appName}
            </span>
          </a>
        )}
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
