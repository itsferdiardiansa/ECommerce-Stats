'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { configureApiAuth, configureApiTimeout } from '@/lib/api-client'
import { safeNextPath } from '@/lib/next-path'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuth } from '@/features/auth/context/AuthContext'

const COUNTDOWN = 5

export function SessionExpiredProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { setSession, clear } = useAuth()
  const [expired, setExpired] = useState(false)
  const [seconds, setSeconds] = useState(COUNTDOWN)
  const nextRef = useRef('/')
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)
  const redirectedRef = useRef(false)

  const refresh = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current
    const promise = authApi
      .refresh()
      .then(res => {
        setSession(res.accessToken, null)
        return res.accessToken
      })
      .catch(() => null)
      .finally(() => {
        refreshPromiseRef.current = null
      })
    refreshPromiseRef.current = promise
    return promise
  }, [setSession])

  const onUnauthorized = useCallback(() => {
    setExpired(prev => {
      if (!prev) {
        nextRef.current = window.location.pathname + window.location.search
        redirectedRef.current = false
      }
      return true
    })
  }, [])

  useEffect(() => {
    configureApiAuth({ refresh, onUnauthorized })
  }, [refresh, onUnauthorized])

  useEffect(() => {
    configureApiTimeout(({ retry, giveUp }) => {
      let handled = false
      toast.error('The request timed out. Check your connection.', {
        duration: 8000,
        action: {
          label: 'Retry',
          onClick: () => {
            handled = true
            retry()
          },
        },
        onAutoClose: () => {
          if (!handled) giveUp()
        },
        onDismiss: () => {
          if (!handled) giveUp()
        },
      })
    })
    return () => configureApiTimeout(null)
  }, [])

  const redirect = useCallback(() => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    clear()
    const next = safeNextPath(nextRef.current, '')
    router.replace(
      next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in'
    )
    setExpired(false)
  }, [clear, router])

  useEffect(() => {
    if (expired) setSeconds(COUNTDOWN)
  }, [expired])

  useEffect(() => {
    if (!expired) return
    if (seconds <= 0) {
      redirect()
      return
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [expired, seconds, redirect])

  return (
    <>
      {children}
      {expired ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-lg">
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold">Session expired</h2>
              <p className="text-muted-foreground text-sm">
                For your security, your session has expired. Redirecting you to
                sign in in {seconds}s.
              </p>
            </div>
            <Button className="w-full" onClick={redirect}>
              Sign in now
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
