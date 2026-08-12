'use client'

import { useProfile } from '@/features/account/hooks/useAccountQueries'

export function Greeting() {
  const { data: profile } = useProfile()
  const name = profile?.name?.trim() || profile?.username || null

  return (
    <h2 className="text-2xl font-bold tracking-tight">
      {name ? `Hi, ${name}` : 'Welcome back'}
    </h2>
  )
}
