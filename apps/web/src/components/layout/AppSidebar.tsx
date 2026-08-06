'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  SidebarRail,
} from '@/components/ui/sidebar'
import { navItems, accountNavItems } from '@/config/navConfig'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import {
  IconArrowLeft,
  IconChevronRight,
  IconChevronsDown,
  IconLogout,
  IconSettings,
} from '@tabler/icons-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useLogout } from '@/features/auth/hooks/useAuthMutations'
import { Icons } from './Icons'
import { OrgSwitcher } from './OrgSwitcher'

const mockUser = {
  fullName: 'its_ferdi',
  email: 'example@example.com',
  initials: 'IF',
}

export default function AppSidebar() {
  const pathname = usePathname()
  const isAccount = pathname.startsWith('/account')
  const items = isAccount ? accountNavItems : navItems
  const router = useRouter()
  const { isOpen } = useMediaQuery()
  const { accessToken, clear } = useAuth()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  React.useEffect(() => {}, [isOpen])

  function confirmLogout() {
    const finish = () => {
      clear()
      router.replace('/sign-in')
    }
    if (accessToken) {
      logout(accessToken, { onSuccess: finish, onError: finish })
    } else {
      finish()
    }
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <OrgSwitcher />
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden">
          {isAccount ? (
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Back to dashboard">
                    <Link href="/">
                      <IconArrowLeft className="size-4" />
                      <span className="truncate">Back to dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          ) : null}
          <SidebarGroup>
            <SidebarGroupLabel>
              {isAccount ? 'Account' : 'Overview'}
            </SidebarGroupLabel>
            <SidebarMenu>
              {items.map(item => {
                const hasChildren = !!(item?.items && item.items.length > 0)
                const isActiveItem =
                  pathname === item.url ||
                  (hasChildren && item.items?.some(si => si.url === pathname))
                const NavIcon = item.icon
                  ? Icons[item.icon as keyof typeof Icons]
                  : null

                return hasChildren ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActiveItem}
                    >
                      {NavIcon ? <NavIcon className="size-4 shrink-0" /> : null}
                      <span className="truncate">{item.title}</span>
                      <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {item.items?.map(subItem => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                          >
                            <Link
                              href={subItem.url}
                              className={cn(
                                'w-full',
                                pathname === subItem.url &&
                                  'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                              )}
                            >
                              <span className="truncate">{subItem.title}</span>
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
                      isActive={isActiveItem}
                    >
                      <Link
                        href={item.url}
                        className={cn(
                          'w-full',
                          isActiveItem &&
                            'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        )}
                      >
                        {NavIcon ? (
                          <NavIcon className="size-4 shrink-0" />
                        ) : null}
                        <span className="truncate">{item.title}</span>
                      </Link>
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
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {mockUser.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {mockUser.fullName}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {mockUser.email}
                      </span>
                    </div>
                    <IconChevronsDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="px-1 py-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarFallback className="rounded-lg">
                            {mockUser.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">
                            {mockUser.fullName}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            {mockUser.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/account">
                      <IconSettings className="size-4" />
                      Account settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setConfirmOpen(true)}
                    className="cursor-pointer"
                  >
                    <IconLogout className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <Dialog
        open={confirmOpen}
        onOpenChange={next => {
          if (!isLoggingOut) setConfirmOpen(next)
        }}
      >
        <DialogContent
          className="sm:max-w-sm"
          onEscapeKeyDown={e => {
            if (isLoggingOut) e.preventDefault()
          }}
          onInteractOutside={e => {
            if (isLoggingOut) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You&apos;ll need to sign in again to get back into your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}
              loading={isLoggingOut}
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
