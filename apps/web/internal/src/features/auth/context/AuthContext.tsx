'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import {
  authApi,
  type LoginResult,
  type StaffProfile,
} from '@/features/auth/api'

interface AuthContextValue {
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
  const [token, setToken] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffProfile | null>(null)

  const login = useCallback(
    (email: string, password: string, signal?: AbortSignal) => {
      return authApi.login(email, password, signal)
    },
    []
  )

  const verifyMfa = useCallback(
    async (mfaToken: string, code: string, signal?: AbortSignal) => {
      const session = await authApi.verifyMfa(mfaToken, code, signal)
      setToken(session.accessToken)
      const profile = await authApi.me(session.accessToken, signal)
      setStaff(profile)
    },
    []
  )

  const logout = useCallback(async () => {
    if (token) {
      try {
        await authApi.logout(token)
      } catch {
        /* best effort */
      }
    }
    setToken(null)
    setStaff(null)
  }, [token])

  return (
    <AuthContext.Provider value={{ token, staff, login, verifyMfa, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
