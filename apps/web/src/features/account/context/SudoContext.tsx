'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { accountApi } from '@/features/account/api/account.api'
import { accountKeys } from '@/features/account/api/account.keys'
import { useSudoAuthorize } from '@/features/account/hooks/useAccountMutations'
import { useAuth } from '@/features/auth/context/AuthContext'
import { SudoPrompt } from '@/features/account/components/SudoPrompt'

export class SudoCancelledError extends Error {
  constructor() {
    super('Sudo confirmation was cancelled')
    this.name = 'SudoCancelledError'
  }
}

interface SudoContextValue {
  checkSudo: () => Promise<boolean>
  authorize: (password: string) => Promise<void>
  perform: <T>(
    action: () => Promise<T>,
    options?: { force?: boolean }
  ) => Promise<T>
}

const SudoContext = createContext<SudoContextValue | null>(null)

export function SudoProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  const authorizeMutation = useSudoAuthorize()
  const [promptOpen, setPromptOpen] = useState(false)
  const resolverRef = useRef<((ok: boolean) => void) | null>(null)

  const checkSudo = useCallback(async () => {
    if (!accessToken) return false
    try {
      const data = await qc.fetchQuery({
        queryKey: accountKeys.sudo(),
        queryFn: () => accountApi.sudoStatus(accessToken),
        staleTime: 0,
      })
      return data.active
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SESSION_INVALID') throw e
      return false
    }
  }, [accessToken, qc])

  const authorize = useCallback(
    async (password: string) => {
      await authorizeMutation.mutateAsync(password)
    },
    [authorizeMutation]
  )

  const requireSudo = useCallback(
    () =>
      new Promise<boolean>(resolve => {
        resolverRef.current = resolve
        setPromptOpen(true)
      }),
    []
  )

  const settle = useCallback((ok: boolean) => {
    const resolve = resolverRef.current
    resolverRef.current = null
    setPromptOpen(false)
    resolve?.(ok)
  }, [])

  const perform = useCallback(
    async <T,>(
      action: () => Promise<T>,
      options?: { force?: boolean }
    ): Promise<T> => {
      const active = options?.force ? false : await checkSudo()
      if (!active) {
        const ok = await requireSudo()
        if (!ok) throw new SudoCancelledError()
      }
      try {
        return await action()
      } catch (e) {
        if (e instanceof ApiError && e.code === 'SUDO_REQUIRED') {
          const ok = await requireSudo()
          if (!ok) throw new SudoCancelledError()
          return await action()
        }
        throw e
      }
    },
    [checkSudo, requireSudo]
  )

  const onPromptAuthorize = useCallback(
    async (password: string) => {
      await authorize(password)
      settle(true)
    },
    [authorize, settle]
  )

  const value = useMemo(
    () => ({ checkSudo, authorize, perform }),
    [checkSudo, authorize, perform]
  )

  return (
    <SudoContext.Provider value={value}>
      {children}
      <SudoPrompt
        open={promptOpen}
        onAuthorize={onPromptAuthorize}
        onCancel={() => settle(false)}
      />
    </SudoContext.Provider>
  )
}

export function useSudo() {
  const ctx = useContext(SudoContext)
  if (!ctx) throw new Error('useSudo must be used within a SudoProvider')
  return ctx
}
