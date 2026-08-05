'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { safeNextPath } from '@/lib/next-path'
import { useAuth } from '../context/AuthContext'

export function RedirectIfAuthenticated({
  next,
  children,
}: {
  next?: string
  children: React.ReactNode
}) {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status !== 'authenticated') return
    router.replace(safeNextPath(next))
  }, [status, router, next])

  if (status !== 'unauthenticated') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[50vh] items-center justify-center"
      >
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
        <span className="sr-only">Checking your session…</span>
      </div>
    )
  }

  return <>{children}</>
}
