import { apiFetch } from '@/lib/api-client'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'
import type { PasskeySummary } from '../types'

/** Authenticated MFA endpoints. All require the in-memory access token; the
 * enrol/delete calls additionally require a recent sudo grant. */
const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

export const mfaApi = {
  sudoWithPassword: (token: string, password: string) =>
    apiFetch<{ expiresIn: number }>('/auth/sudo', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ method: 'password', password }),
    }),

  listPasskeys: (token: string) =>
    apiFetch<{ passkeys: PasskeySummary[] }>('/auth/mfa/passkeys', {
      headers: auth(token),
    }),

  passkeyRegisterOptions: (token: string) =>
    apiFetch<PublicKeyCredentialCreationOptionsJSON>(
      '/auth/mfa/passkeys/options',
      { method: 'POST', headers: auth(token) }
    ),

  passkeyRegisterVerify: (
    token: string,
    response: RegistrationResponseJSON,
    name: string
  ) =>
    apiFetch<{ id: string; name: string | null }>('/auth/mfa/passkeys/verify', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ response, name }),
    }),

  deletePasskey: (token: string, id: string) =>
    apiFetch<null>(`/auth/mfa/passkeys/${id}`, {
      method: 'DELETE',
      headers: auth(token),
    }),
}
