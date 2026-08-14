'use client'

import { useQuery } from '@tanstack/react-query'
import { accountApi } from '@/features/account/api/account.api'
import { accountKeys } from '@/features/account/api/account.keys'
import { useCursorInfinite } from '@/hooks/useCursorInfinite'
import { useAuth } from '@/features/auth/context/AuthContext'

export function useProfile() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: () => accountApi.getMe(accessToken as string),
    enabled: !!accessToken,
  })
}

export function useSessions() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: accountKeys.sessions(),
    queryFn: () => accountApi.listSessions(accessToken as string),
    enabled: !!accessToken,
  })
}

export function useMfaStatus() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: accountKeys.mfa(),
    queryFn: () => accountApi.mfaStatus(accessToken as string),
    enabled: !!accessToken,
  })
}

export function useAccountSettings() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: accountKeys.settings(),
    queryFn: () => accountApi.getSettings(accessToken as string),
    enabled: !!accessToken,
  })
}

export function useAddresses() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: accountKeys.addresses(),
    queryFn: () => accountApi.listAddresses(accessToken as string),
    enabled: !!accessToken,
  })
}

export function useActivity() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...accountKeys.activity(), 'summary'],
    queryFn: () => accountApi.listActivity(accessToken as string, { limit: 5 }),
    enabled: !!accessToken,
  })
}

export function useInfiniteActivity() {
  const { accessToken } = useAuth()
  return useCursorInfinite(
    [...accountKeys.activity(), 'all'],
    params => accountApi.listActivity(accessToken as string, params),
    { limit: 20, enabled: !!accessToken }
  )
}

export function useConnections() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: accountKeys.connections(),
    queryFn: () => accountApi.listConnections(accessToken as string),
    enabled: !!accessToken,
  })
}
