'use client';

import { GalleryVerticalEnd, ChevronsUpDown } from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/Sidebar';

export function OrgSwitcher() {
  const { state } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
            <GalleryVerticalEnd className='size-4' />
          </div>
          <div
            className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
              state === 'collapsed'
                ? 'invisible max-w-0 overflow-hidden opacity-0'
                : 'visible max-w-full opacity-100'
            }`}
          >
            <span className='truncate font-medium'>@rufieltics</span>
          </div>
          <ChevronsUpDown
            className={`ml-auto transition-all duration-200 ease-in-out ${
              state === 'collapsed'
                ? 'invisible max-w-0 opacity-0'
                : 'visible max-w-full opacity-100'
            }`}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
