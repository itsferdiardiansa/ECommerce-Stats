'use client'

import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function OrgSwitcher() {
  const { state } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div
            className={cn(
              'grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out',
              state === 'collapsed'
                ? 'invisible max-w-0 overflow-hidden opacity-0'
                : 'visible max-w-full opacity-100'
            )}
          >
            <span className="truncate font-medium">@rufieltics</span>
          </div>
          <ChevronsUpDown
            className={cn(
              'ml-auto transition-all duration-200 ease-in-out',
              state === 'collapsed'
                ? 'invisible max-w-0 opacity-0'
                : 'visible max-w-full opacity-100'
            )}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
