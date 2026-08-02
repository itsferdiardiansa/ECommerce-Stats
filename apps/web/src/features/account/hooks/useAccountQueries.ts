'use client'

import { useQuery } from '@tanstack/react-query'
import { accountApi } from '@/features/account/api/account.api'
import { accountKeys } from '@/features/account/api/account.keys'
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

export function useSudoStatus() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: accountKeys.sudo(),
    queryFn: () => accountApi.sudoStatus(accessToken as string),
    enabled: !!accessToken,
    staleTime: 0,
    gcTime: 0,
  })
}
