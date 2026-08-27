'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Search, Sparkles } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  cn,
  toast,
} from '@rufieltics/ui'

interface Notification {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
}

const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Dispute needs evidence',
    description: 'Batik Nusantara · submit by Aug 24',
    time: '2m',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Payment failed',
    description: 'CoffeeCo · Rp 299.000 declined',
    time: '1h',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Renewal at risk',
    description: 'Gadget Corner · card expires before charge',
    time: '3h',
    unread: true,
  },
  {
    id: 'n4',
    title: 'Payout settled',
    description: 'Xendit · Rp 61.400.000 to bank',
    time: 'Yesterday',
    unread: false,
  },
]

function ConsoleSearch() {
  const [query, setQuery] = useState('')

  return (
    <div className="relative hidden md:block">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Search…"
        aria-label="Search"
        className="h-9 w-56 pl-8"
      />
    </div>
  )
}

function NotificationsMenu() {
  const unread = NOTIFICATIONS.filter(
    notification => notification.unread
  ).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="bg-destructive ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Notifications</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {unread} new
          </span>
        </div>
        <DropdownMenuSeparator />
        {NOTIFICATIONS.map(notification => (
          <DropdownMenuItem
            key={notification.id}
            className="flex flex-col items-start gap-0.5 py-2"
          >
            <div className="flex w-full items-center gap-2">
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  notification.unread ? 'bg-primary' : 'bg-transparent'
                )}
              />
              <span className="flex-1 truncate text-sm font-medium">
                {notification.title}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {notification.time}
              </span>
            </div>
            <span className="text-muted-foreground truncate pl-3.5 text-xs">
              {notification.description}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="justify-center text-sm font-medium"
        >
          <Link href="/notifications">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ConsoleHeaderActions() {
  return (
    <div className="flex items-center gap-1.5">
      <ConsoleSearch />
      <span
        aria-hidden
        className="bg-border mx-0.5 hidden h-5 w-px shrink-0 md:block"
      />
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => toast('AI assistant is coming soon')}
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Ask AI</span>
      </Button>
      <NotificationsMenu />
    </div>
  )
}
