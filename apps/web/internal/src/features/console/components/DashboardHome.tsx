'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context'
import { greetingFor } from '@/features/console/greeting'

export function DashboardHome() {
  const { staff } = useAuth()
  const [greeting, setGreeting] = useState(() => greetingFor())

  useEffect(() => {
    const id = setInterval(() => setGreeting(greetingFor()), 60_000)
    return () => clearInterval(id)
  }, [])

  const name = staff?.name || staff?.email || 'there'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-muted-foreground text-sm">
        {new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {greeting}, {name}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        Welcome to the platform console. Pick a section from the sidebar to get
        started.
      </p>
    </div>
  )
}
