'use client'

import * as React from 'react'
import { Button } from '@/components/button'

interface SessionExpiredContextValue {
  /** Show the expiry modal and start the countdown (idempotent). */
  triggerExpired: () => void
}

const SessionExpiredContext =
  React.createContext<SessionExpiredContextValue | null>(null)

export interface SessionExpiredProviderProps {
  children: React.ReactNode
  /** Where to send the user; the current path is appended as `?next=`. */
  signInPath?: string
  countdown?: number
  title?: string
  description?: (seconds: number) => React.ReactNode
  actionLabel?: string
}

export function SessionExpiredProvider({
  children,
  signInPath = '/sign-in',
  countdown = 5,
  title = 'Session expired',
  actionLabel = 'Sign in now',
  description,
}: SessionExpiredProviderProps) {
  const [expired, setExpired] = React.useState(false)
  const [seconds, setSeconds] = React.useState(countdown)
  const nextRef = React.useRef('/')
  const redirectedRef = React.useRef(false)

  const triggerExpired = React.useCallback(() => {
    setExpired(prev => {
      if (!prev) {
        nextRef.current = window.location.pathname + window.location.search
        redirectedRef.current = false
        setSeconds(countdown)
      }
      return true
    })
  }, [countdown])

  const redirect = React.useCallback(() => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    const next =
      nextRef.current && nextRef.current !== '/'
        ? `?next=${encodeURIComponent(nextRef.current)}`
        : ''
    window.location.replace(`${signInPath}${next}`)
  }, [signInPath])

  React.useEffect(() => {
    if (!expired) return
    if (seconds <= 0) {
      redirect()
      return
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [expired, seconds, redirect])

  return (
    <SessionExpiredContext.Provider value={{ triggerExpired }}>
      {children}
      {expired ? (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-background w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-lg">
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-muted-foreground text-sm">
                {description
                  ? description(seconds)
                  : `For your security, your session has expired. Redirecting to sign in in ${seconds}s.`}
              </p>
            </div>
            <Button className="w-full" onClick={redirect}>
              {actionLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </SessionExpiredContext.Provider>
  )
}

export function useSessionExpired(): SessionExpiredContextValue {
  const ctx = React.useContext(SessionExpiredContext)
  if (!ctx) {
    throw new Error(
      'useSessionExpired must be used within a SessionExpiredProvider'
    )
  }
  return ctx
}
