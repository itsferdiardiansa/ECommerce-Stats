'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuth } from '@/features/auth/context/AuthContext'
import { AuthCard } from '@/features/auth/components/AuthCard'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    authApi
      .refresh()
      .then(res => {
        setSession(res.accessToken, null)
        router.replace('/')
      })
      .catch(() => {
        router.replace('/sign-in?error=oauth')
      })
  }, [router, setSession])

  return (
    <AuthCard title="Signing you in">
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 py-4"
      >
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Please wait while we finish signing you in.
        </p>
      </div>
    </AuthCard>
  )
}
