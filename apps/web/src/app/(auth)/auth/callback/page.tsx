'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
        router.replace('/security')
      })
      .catch(() => {
        router.replace('/sign-in?error=oauth')
      })
  }, [router, setSession])

  return (
    <AuthCard title="Signing you in" description="Completing sign-in…">
      <p role="status" className="text-muted-foreground text-sm">
        Please wait while we finish signing you in.
      </p>
    </AuthCard>
  )
}
