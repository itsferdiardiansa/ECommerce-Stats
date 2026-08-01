'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { AuthUser } from '../types'

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  setSession: (accessToken: string, user: AuthUser | null) => void
  clear: () => void
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * Minimal in-memory session: holds the access token + user for the tab's
 * lifetime. The durable refresh/deviceSecret cookies are httpOnly and handled
 * by the browser; refresh-on-load and guards are a later phase.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  const setSession = useCallback((token: string, nextUser: AuthUser | null) => {
    setAccessToken(token)
    setUser(nextUser)
  }, [])

  const clear = useCallback(() => {
    setAccessToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ accessToken, user, setSession, clear }),
    [accessToken, user, setSession, clear]
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
