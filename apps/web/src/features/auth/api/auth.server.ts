import { api } from '@/lib/api-client'

export type SecureTokenState = 'valid' | 'already_secured' | 'invalid'

export async function checkSecureToken(
  token: string
): Promise<SecureTokenState> {
  try {
    const { state } = await api.post<{ state: SecureTokenState }>(
      '/auth/secure-account/verify',
      { token },
      { cache: 'no-store', credentials: 'omit' }
    )
    return state ?? 'invalid'
  } catch {
    return 'invalid'
  }
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  try {
    const { valid } = await api.post<{ valid: boolean }>(
      '/auth/reset-password/verify',
      { token },
      { cache: 'no-store', credentials: 'omit' }
    )
    return valid === true
  } catch {
    return false
  }
}

export async function isStepUpChallengeValid(
  challengeId: string
): Promise<boolean> {
  try {
    const { valid } = await api.post<{ valid: boolean }>(
      '/auth/login/step-up/verify',
      { challengeId },
      { cache: 'no-store', credentials: 'omit' }
    )
    return valid === true
  } catch {
    return false
  }
}
