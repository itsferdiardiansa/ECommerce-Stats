'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { authApi } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken, setSession } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(accessToken !== null)
  const started = useRef(false)

  useEffect(() => {
    if (accessToken) {
      setReady(true)
      return
    }
    if (started.current) return
    started.current = true

    authApi
      .refresh()
      .then(res => {
        setSession(res.accessToken, null)
        setReady(true)
      })
      .catch(() => router.replace('/sign-in'))
  }, [accessToken, router, setSession])

  if (!ready) {
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
