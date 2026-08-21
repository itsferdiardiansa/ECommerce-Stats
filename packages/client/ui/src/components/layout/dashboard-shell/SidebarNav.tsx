'use client'

import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/sidebar'
import { Skeleton } from '@/components/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardNavGroup, DashboardNavItem } from './types'

function NavBadge({ value }: { value: string | number }) {
  return (
    <span className="bg-sidebar-accent text-sidebar-accent-foreground ml-auto shrink-0 rounded-md px-1.5 text-xs group-data-[collapsible=icon]:hidden">
      {value}
    </span>
  )
}

function SoonTag() {
  return (
    <span className="border-sidebar-border text-muted-foreground ml-auto shrink-0 rounded border px-1.5 text-[10px] font-medium tracking-wide uppercase group-data-[collapsible=icon]:hidden">
      Soon
    </span>
  )
}

function NavLeaf({ item }: { item: DashboardNavItem }) {
  const Icon = item.icon

  if (item.disabled) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          tooltip={`${item.title} - coming soon`}
          className="cursor-not-allowed opacity-50"
          aria-disabled
        >
          {Icon ? <Icon className="size-4 shrink-0" /> : null}
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          <SoonTag />
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const content = (
    <>
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {item.badge !== undefined ? <NavBadge value={item.badge} /> : null}
    </>
  )

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={item.active} tooltip={item.title}>
        {item.active ? (
          <span aria-current="page">{content}</span>
        ) : (
          <a href={item.href ?? '#'}>{content}</a>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavCollapsible({ item }: { item: DashboardNavItem }) {
  const childActive = item.items?.some(sub => sub.active) ?? false
  const [open, setOpen] = useState(item.defaultOpen ?? childActive)
  const Icon = item.icon

  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={childActive && !open}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        {Icon ? <Icon className="size-4 shrink-0" /> : null}
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
        <ChevronRight
          className={cn(
            'ml-auto size-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden',
            open && 'rotate-90'
          )}
        />
      </SidebarMenuButton>
      {open ? (
        <SidebarMenuSub>
          {item.items?.map(sub =>
            sub.disabled ? (
              <SidebarMenuSubItem key={sub.title}>
                <SidebarMenuSubButton
                  aria-disabled
                  className="cursor-not-allowed opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate">{sub.title}</span>
                  <SoonTag />
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ) : (
              <SidebarMenuSubItem key={sub.title}>
                <SidebarMenuSubButton asChild isActive={sub.active}>
                  {sub.active ? (
                    <span aria-current="page">
                      <span className="min-w-0 flex-1 truncate">
                        {sub.title}
                      </span>
                      {sub.badge !== undefined ? (
                        <NavBadge value={sub.badge} />
                      ) : null}
                    </span>
                  ) : (
                    <a href={sub.href ?? '#'}>
                      <span className="min-w-0 flex-1 truncate">
                        {sub.title}
                      </span>
                      {sub.badge !== undefined ? (
                        <NavBadge value={sub.badge} />
                      ) : null}
                    </a>
                  )}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          )}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  )
}

function NavEntry({ item }: { item: DashboardNavItem }) {
  return item.items?.length ? (
    <NavCollapsible item={item} />
  ) : (
    <NavLeaf item={item} />
  )
}

export function SidebarNavSkeleton() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {Array.from({ length: 5 }).map((_, i) => (
          <SidebarMenuItem key={i}>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function SidebarNav({ groups }: { groups: DashboardNavGroup[] }) {
  return (
    <>
      {groups.map((group, index) => (
        <SidebarGroup key={group.label ?? `group-${index}`}>
          {group.label ? (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          ) : null}
          <SidebarMenu>
            {group.items.map(item => (
              <NavEntry key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
