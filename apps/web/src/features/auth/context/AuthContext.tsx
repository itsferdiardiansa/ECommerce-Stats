'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { authApi } from '../api/auth.api'
import type { AuthUser } from '../types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  accessToken: string | null
  user: AuthUser | null
  setSession: (accessToken: string, user: AuthUser | null) => void
  clear: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const bootstrapped = useRef(false)

  const setSession = useCallback((token: string, nextUser: AuthUser | null) => {
    setAccessToken(token)
    setUser(nextUser)
    setStatus('authenticated')
  }, [])

  const clear = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    authApi
      .refresh()
      .then(res => setSession(res.accessToken, null))
      .catch(() => setStatus('unauthenticated'))
  }, [setSession])

  const value = useMemo(
    () => ({ status, accessToken, user, setSession, clear }),
    [status, accessToken, user, setSession, clear]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
