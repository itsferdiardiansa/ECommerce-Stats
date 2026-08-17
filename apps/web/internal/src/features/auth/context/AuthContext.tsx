'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSessionExpired } from '@rufieltics/ui'
import { configureApiAuth } from '@/lib/api-client'
import {
  authApi,
  type LoginResult,
  type StaffProfile,
} from '@/features/auth/api'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  token: string | null
  staff: StaffProfile | null
  login: (
    email: string,
    password: string,
    signal?: AbortSignal
  ) => Promise<LoginResult>
  verifyMfa: (
    mfaToken: string,
    code: string,
    signal?: AbortSignal
  ) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { triggerExpired } = useSessionExpired()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const tokenRef = useRef<string | null>(null)

  const setSession = useCallback((next: string | null) => {
    tokenRef.current = next
    setToken(next)
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
    setStaff(null)
    setStatus('unauthenticated')
  }, [setSession])

  useEffect(() => {
    configureApiAuth({
      refresh: async () => {
        try {
          const { accessToken } = await authApi.refresh()
          setSession(accessToken)
          return accessToken
        } catch {
          return null
        }
      },
      onUnauthorized: triggerExpired,
    })
  }, [setSession, triggerExpired])

  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      try {
        const { accessToken } = await authApi.refresh()
        const profile = await authApi.me(accessToken)
        if (!active) return
        setSession(accessToken)
        setStaff(profile)
        setStatus('authenticated')
      } catch {
        if (!active) return
        clearSession()
      }
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [setSession, clearSession])

  const login = useCallback(
    (email: string, password: string, signal?: AbortSignal) => {
      return authApi.login(email, password, signal)
    },
    []
  )

  const verifyMfa = useCallback(
    async (mfaToken: string, code: string, signal?: AbortSignal) => {
      const session = await authApi.verifyMfa(mfaToken, code, signal)
      const profile = await authApi.me(session.accessToken, signal)
      setSession(session.accessToken)
      setStaff(profile)
      setStatus('authenticated')
    },
    [setSession]
  )

  const logout = useCallback(async () => {
    if (tokenRef.current) {
      try {
        await authApi.logout(tokenRef.current)
      } catch {
        /* best effort */
      }
    }
    clearSession()
  }, [clearSession])

  return (
    <AuthContext.Provider
      value={{ status, token, staff, login, verifyMfa, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
