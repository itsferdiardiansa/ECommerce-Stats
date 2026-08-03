'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  browserSupportsWebAuthnAutofill,
  startAuthentication,
} from '@simplewebauthn/browser'
import type { AuthenticationResponseJSON } from '@simplewebauthn/browser'
import { Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import { safeNextPath } from '@/lib/next-path'
import { authApi } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'
import { FormError } from './FormError'

/**
 * Passwordless sign-in. On mount it arms WebAuthn conditional UI so the browser
 * offers the passkey in the email field's autofill; the button is an explicit
 * (modal) fallback. Both verify a discoverable assertion and issue a session.
 */
export function PasskeyAutofill({ next }: { next?: string }) {
  const router = useRouter()
  const { setSession } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const armed = useRef(false)

  async function complete(
    challengeId: string,
    response: AuthenticationResponseJSON
  ) {
    const session = await authApi.passkeyDiscoverVerify({
      challengeId,
      response,
    })
    setSession(session.accessToken, null)
    router.push(safeNextPath(next))
  }

  // Arm conditional UI (autofill) once, in the background.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        if (armed.current) return
        if (!(await browserSupportsWebAuthnAutofill())) return
        armed.current = true
        const { challengeId, options } = await authApi.passkeyDiscoverOptions()
        const response = await startAuthentication({
          optionsJSON: options,
          useBrowserAutofill: true,
        })
        if (!cancelled) await complete(challengeId, response)
      } catch {
        // No passkey chosen / autofill aborted / superseded — stay silent.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Explicit modal picker (supersedes the armed conditional ceremony).
  async function onClick() {
    setError(null)
    setPending(true)
    try {
      const { challengeId, options } = await authApi.passkeyDiscoverOptions()
      const response = await startAuthentication({ optionsJSON: options })
      await complete(challengeId, response)
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Passkey sign-in was cancelled or unavailable.'
      )
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onClick}
        loading={pending}
      >
        {pending ? null : <Fingerprint className="size-4" aria-hidden="true" />}
        {pending ? 'Waiting for passkey…' : 'Sign in with a passkey'}
      </Button>
      <FormError message={error} />
    </div>
  )
}
