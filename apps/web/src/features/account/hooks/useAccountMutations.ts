'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountApi } from '@/features/account/api/account.api'
import { accountKeys } from '@/features/account/api/account.keys'
import { useAuth } from '@/features/auth/context/AuthContext'

interface ProfileUpdate {
  name?: string
  username?: string
  phone?: string | null
  avatar?: string | null
}

export function useUpdateProfile() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; data: ProfileUpdate }) =>
      accountApi.updateProfile(accessToken as string, vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.profile() }),
  })
}

export function useRequestEmailChange() {
  const { accessToken } = useAuth()
  return useMutation({
    mutationFn: (newEmail: string) =>
      accountApi.requestEmailChange(accessToken as string, newEmail),
  })
}

export function useConfirmEmailChange() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      accountApi.confirmEmailChange(accessToken as string, code),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.profile() }),
  })
}

export function useChangePassword() {
  const { accessToken } = useAuth()
  return useMutation({
    mutationFn: (password: string) =>
      accountApi.changePassword(accessToken as string, password),
  })
}

export function useSudoAuthorize() {
  const { accessToken } = useAuth()
  return useMutation({
    mutationFn: (password: string) =>
      accountApi.sudoPassword(accessToken as string, password),
  })
}

export function useTotpBegin() {
  const { accessToken } = useAuth()
  return useMutation({
    mutationFn: () => accountApi.totpBegin(accessToken as string),
  })
}

export function useTotpConfirm() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      accountApi.totpConfirm(accessToken as string, code),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.mfa() }),
  })
}

export function useTotpDisable() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => accountApi.totpDisable(accessToken as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.mfa() }),
  })
}

export function useRegenerateRecoveryCodes() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => accountApi.regenerateRecoveryCodes(accessToken as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.mfa() }),
  })
}

export function useRevokeSession() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      accountApi.revokeSession(accessToken as string, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.sessions() }),
  })
}

export function useRevokeOtherSessions() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => accountApi.revokeOtherSessions(accessToken as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.sessions() }),
  })
}
