'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { startRegistration } from '@simplewebauthn/browser'
import { KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api-client'
import { mfaApi } from '../api/mfa.api'
import { useAuth } from '../context/AuthContext'
import type { PasskeySummary } from '../types'
import { FormError } from './FormError'

const errMessage = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback

export function SecuritySettings() {
  const { accessToken } = useAuth()
  const [passkeys, setPasskeys] = useState<PasskeySummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoadError(null)
    try {
      const res = await mfaApi.listPasskeys(accessToken)
      setPasskeys(res.passkeys)
    } catch (e) {
      setLoadError(errMessage(e, 'Could not load your passkeys.'))
    }
  }, [accessToken])

  useEffect(() => {
    void load()
  }, [load])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      // Re-auth (sudo) is required to add a strong factor.
      await mfaApi.sudoWithPassword(accessToken, password)
      const optionsJSON = await mfaApi.passkeyRegisterOptions(accessToken)
      // Triggers the OS passkey sheet (Touch ID / Windows Hello).
      const response = await startRegistration({ optionsJSON })
      await mfaApi.passkeyRegisterVerify(
        accessToken,
        response,
        name.trim() || 'My passkey'
      )
      setStatus('Passkey added.')
      setName('')
      setPassword('')
      await load()
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Passkey creation was cancelled or unavailable.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    if (!accessToken) return
    const pw = window.prompt('Confirm your password to remove this passkey')
    if (!pw) return
    setError(null)
    setStatus(null)
    try {
      await mfaApi.sudoWithPassword(accessToken, pw)
      await mfaApi.deletePasskey(accessToken, id)
      setStatus('Passkey removed.')
      await load()
    } catch (e) {
      setError(errMessage(e, 'Could not remove the passkey.'))
    }
  }

  if (!accessToken) {
    return (
      <p className="text-muted-foreground text-sm">
        Please{' '}
        <Link href="/sign-in" className="text-foreground font-medium underline">
          sign in
        </Link>{' '}
        to manage your passkeys.
      </p>
    )
  }

  return (
    <div className="max-w-xl space-y-8">
      <section aria-labelledby="passkeys-heading" className="space-y-4">
        <div>
          <h2 id="passkeys-heading" className="text-lg font-semibold">
            Passkeys
          </h2>
          <p className="text-muted-foreground text-sm">
            Sign in with Touch ID, Windows Hello, or a security key.
          </p>
        </div>

        <div aria-live="polite">
          {status ? (
            <p role="status" className="text-sm text-emerald-600">
              {status}
            </p>
          ) : null}
        </div>
        <FormError message={error ?? loadError} />

        <ul className="divide-border divide-y rounded-md border">
          {passkeys && passkeys.length > 0 ? (
            passkeys.map(pk => (
              <li
                key={pk.id}
                className="flex items-center justify-between gap-4 p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <KeyRound
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {pk.name ?? 'Passkey'}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      Added {new Date(pk.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(pk.id)}
                  aria-label={`Remove passkey ${pk.name ?? ''}`.trim()}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground p-3 text-sm">
              {passkeys ? 'No passkeys yet.' : 'Loading…'}
            </li>
          )}
        </ul>
      </section>

      <section aria-labelledby="add-passkey-heading" className="space-y-4">
        <h2 id="add-passkey-heading" className="text-lg font-semibold">
          Add a passkey
        </h2>
        <form onSubmit={onAdd} noValidate className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="pk-name">Passkey name</Label>
            <Input
              id="pk-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. MacBook Touch ID"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pk-password">Confirm your password</Label>
            <Input
              id="pk-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={busy || !password} aria-busy={busy}>
            {busy ? 'Creating passkey…' : 'Create passkey'}
          </Button>
        </form>
      </section>
    </div>
  )
}
