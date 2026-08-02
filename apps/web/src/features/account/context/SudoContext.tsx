'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { accountKeys } from '@/features/account/api/account.keys'
import { useSudoStatus } from '@/features/account/hooks/useAccountQueries'
import { useSudoAuthorize } from '@/features/account/hooks/useAccountMutations'
import { useAuth } from '@/features/auth/context/AuthContext'

interface SudoContextValue {
  isValid: boolean
  loading: boolean
  error: string | null
  authorize: (password: string) => Promise<void>
  invalidate: () => void
}

const SudoContext = createContext<SudoContextValue | null>(null)

export function SudoProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  const status = useSudoStatus()
  const authorizeMutation = useSudoAuthorize()
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  useEffect(() => {
    if (!status.data) return
    setExpiresAt(
      status.data.active ? Date.now() + status.data.expiresIn * 1000 : null
    )
  }, [status.data])

  useEffect(() => {
    if (expiresAt === null) return
    const ms = expiresAt - Date.now()
    if (ms <= 0) {
      setExpiresAt(null)
      return
    }
    const t = setTimeout(() => setExpiresAt(null), ms)
    return () => clearTimeout(t)
  }, [expiresAt])

  const authorize = useCallback(
    async (password: string) => {
      const { expiresIn } = await authorizeMutation.mutateAsync(password)
      qc.setQueryData(accountKeys.sudo(), { active: true, expiresIn })
    },
    [authorizeMutation, qc]
  )

  const invalidate = useCallback(() => {
    qc.setQueryData(accountKeys.sudo(), { active: false, expiresIn: 0 })
    setExpiresAt(null)
  }, [qc])

  const loading = !accessToken || status.isLoading
  const error = status.error
    ? status.error instanceof ApiError
      ? status.error.message
      : 'Could not check your session.'
    : null

  return (
    <SudoContext.Provider
      value={{
        isValid: expiresAt !== null,
        loading,
        error,
        authorize,
        invalidate,
      }}
    >
      {children}
    </SudoContext.Provider>
  )
}

export function useSudo() {
  const ctx = useContext(SudoContext)
  if (!ctx) throw new Error('useSudo must be used within a SudoProvider')
  return ctx
}
