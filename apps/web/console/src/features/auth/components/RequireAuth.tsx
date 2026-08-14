'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status !== 'unauthenticated') return
    const next = window.location.pathname + window.location.search
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`)
  }, [status, router])

  if (status !== 'authenticated') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center"
      >
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
        <span className="sr-only">Checking your session…</span>
      </div>
    )
  }

  return <>{children}</>
}
