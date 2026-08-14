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
  listPasskeys: (token: string) =>
    apiFetch<{ passkeys: PasskeySummary[] }>('/auth/mfa/passkeys', {
      headers: auth(token),
    }),

  passkeyRegisterOptions: (
    token: string,
    attachment?: 'platform' | 'cross-platform'
  ) =>
    apiFetch<PublicKeyCredentialCreationOptionsJSON>(
      '/auth/mfa/passkeys/options',
      {
        method: 'POST',
        headers: auth(token),
        body: JSON.stringify(attachment ? { attachment } : {}),
        timeoutMs: 20000,
      }
    ),

  passkeyRegisterVerify: (
    token: string,
    response: RegistrationResponseJSON,
    name?: string
  ) =>
    apiFetch<{ id: string; name: string | null }>('/auth/mfa/passkeys/verify', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify(name ? { response, name } : { response }),
      timeoutMs: 20000,
    }),

  renamePasskey: (token: string, id: string, name: string) =>
    apiFetch<null>(`/auth/mfa/passkeys/${id}`, {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ name }),
    }),

  deletePasskey: (token: string, id: string) =>
    apiFetch<null>(`/auth/mfa/passkeys/${id}`, {
      method: 'DELETE',
      headers: auth(token),
    }),
}
