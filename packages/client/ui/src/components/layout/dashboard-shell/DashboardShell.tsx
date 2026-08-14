'use client'

import * as React from 'react'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/avatar'
import { Separator } from '@/components/separator'

export interface DashboardNavItem {
  title: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  active?: boolean
}

export interface DashboardShellProps {
  appName: string
  nav: DashboardNavItem[]
  navLabel?: string
  user?: { name?: string | null; email?: string | null }
  headerActions?: React.ReactNode
  onSignOut?: () => void
  children: React.ReactNode
}

function initialsOf(text: string) {
  return (
    (text || '?')
      .split(/[\s_@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase() || '?'
  )
}

export function DashboardShell({
  appName,
  nav,
  navLabel = 'Menu',
  user,
  headerActions,
  onSignOut,
  children,
}: DashboardShellProps) {
  const display = user?.name || user?.email || '—'

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
              R
            </div>
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              {appName}
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{navLabel}</SidebarGroupLabel>
            <SidebarMenu>
              {nav.map(item => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={item.title}
                    >
                      <a href={item.href ?? '#'}>
                        {Icon ? <Icon className="size-4" /> : null}
                        <span>{item.title}</span>
                        {item.badge != null ? (
                          <span className="bg-sidebar-accent text-sidebar-accent-foreground ml-auto rounded-md px-1.5 text-xs group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        ) : null}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8 rounded-md">
                      <AvatarFallback className="rounded-md text-xs">
                        {initialsOf(display)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-medium">{display}</span>
                      {user?.email ? (
                        <span className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </span>
                      ) : null}
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="grid text-sm leading-tight">
                      <span className="font-medium">{display}</span>
                      {user?.email ? (
                        <span className="text-muted-foreground text-xs">
                          {user.email}
                        </span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="ml-auto flex items-center gap-2">{headerActions}</div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
