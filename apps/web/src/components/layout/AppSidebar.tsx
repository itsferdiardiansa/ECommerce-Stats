'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/DropdownMenu';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/Sidebar';
import { navItems } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { IconChevronRight, IconChevronsDown } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../Icons';
import { OrgSwitcher } from '../OrgSwitcher';

const mockUser = {
  fullName: 'its_ferdi',
  email: 'example@example.com',
  initials: 'IF'
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  React.useEffect(() => {}, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon
                ? (Icons as Record<string, React.ElementType>)[item.icon]
                : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    {item.icon && <Icon />}
                    <span>{item.title}</span>
                    <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
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
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarFallback className='rounded-lg'>
                      {mockUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>
                      {mockUser.fullName}
                    </span>
                    <span className='text-muted-foreground truncate text-xs'>
                      {mockUser.email}
                    </span>
                  </div>
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-8 w-8 rounded-lg'>
                        <AvatarFallback className='rounded-lg'>
                          {mockUser.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid flex-1 text-left text-sm leading-tight'>
                        <span className='truncate font-medium'>
                          {mockUser.fullName}
                        </span>
                        <span className='text-muted-foreground truncate text-xs'>
                          {mockUser.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
