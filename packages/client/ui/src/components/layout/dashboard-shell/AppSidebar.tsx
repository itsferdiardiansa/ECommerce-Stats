'use client'

import { ChevronLeft } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarToggleButton,
} from '@/components/layout/sidebar'
import { SidebarNav, SidebarNavSkeleton } from '../sidebar/SidebarNav'
import { SidebarUser, SidebarUserSkeleton } from '../sidebar/SidebarUser'
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
      <SidebarHeader className="relative">
        <div className="relative flex items-center justify-between">
          {/* {section ? (
            <a
              href={section.backHref}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-opacity group-data-[collapsible=icon]:group-hover/sidebar:opacity-0"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md">
                <ChevronLeft className="size-4" />
              </div>
              <span className="min-w-0 flex-1 truncate font-semibold group-data-[collapsible=icon]:hidden">
                {section.title}
              </span>
            </a>
          ) : ( */}
          <a
            href={homeHref}
            data-id="brand-logo"
            className="flex items-center gap-2 py-1.5 transition-opacity group-data-[collapsible=icon]:group-hover/sidebar:opacity-0"
          >
            <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
              R
            </div>
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              {appName}
            </span>
          </a>
          {/* )} */}
          <SidebarToggleButton className="duration-200 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-1/2 group-data-[collapsible=icon]:left-0 group-data-[collapsible=icon]:-translate-y-1/2 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:group-hover/sidebar:opacity-100 group-data-[collapsible=icon]:group-hover/sidebar:delay-150" />
        </div>

        <div className="border-sidebar-border has-[[data-slot=sidebar-menu-button]:hover]:border-sidebar-accent has-[[data-slot=sidebar-menu-button][data-state=open]]:border-sidebar-accent overflow-hidden rounded-md border transition-colors">
          {loading ? (
            <SidebarUserSkeleton />
          ) : (
            <SidebarUser user={user} onSignOut={onSignOut} />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {loading ? <SidebarNavSkeleton /> : <SidebarNav groups={groups} />}
      </SidebarContent>
    </Sidebar>
  )
}
