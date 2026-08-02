'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api-client'
import { useSudo } from '@/features/account/context/SudoContext'
import { useMfaStatus } from '@/features/account/hooks/useAccountQueries'
import {
  useRegenerateRecoveryCodes,
  useTotpBegin,
  useTotpConfirm,
  useTotpDisable,
} from '@/features/account/hooks/useAccountMutations'
import { FormError } from '@/features/auth/components/FormError'

type Mode = 'view' | 'password' | 'enrolCode'
type Action = 'enrol' | 'disable' | 'regen'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

const EXPIRED = 'Your confirmation expired. Please enter your password again.'

export default function TwoFactorPage() {
  const sudo = useSudo()
  const status = useMfaStatus()
  const totpBegin = useTotpBegin()
  const totpConfirm = useTotpConfirm()
  const totpDisable = useTotpDisable()
  const regen = useRegenerateRecoveryCodes()

  const [mode, setMode] = useState<Mode>('view')
  const [action, setAction] = useState<Action>('enrol')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toView() {
    setMode('view')
    setPassword('')
    setCode('')
    setSecret(null)
    setError(null)
  }

  async function runAction(which: Action) {
    if (which === 'enrol') {
      const res = await totpBegin.mutateAsync()
      setSecret(res.secret)
      setPassword('')
      setMode('enrolCode')
      return
    }
    if (which === 'disable') {
      await totpDisable.mutateAsync()
      toView()
      return
    }
    const res = await regen.mutateAsync()
    setCodes(res.recoveryCodes)
    toView()
  }

  async function start(which: Action) {
    setError(null)
    setAction(which)
    if (!sudo.isValid) {
      setMode('password')
      return
    }
    setBusy(true)
    try {
      await runAction(which)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUDO_REQUIRED') {
        sudo.invalidate()
        setMode('password')
        setError(EXPIRED)
      } else {
        setError(errText(e, 'Could not complete that action.'))
      }
    } finally {
      setBusy(false)
    }
  }

  async function authorize() {
    setError(null)
    setBusy(true)
    try {
      await sudo.authorize(password)
      await runAction(action)
    } catch (e) {
      setError(errText(e, 'Could not confirm. Check your password.'))
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnrol() {
    setError(null)
    try {
      const res = await totpConfirm.mutateAsync(code)
      setCodes(res.recoveryCodes)
      toView()
    } catch (e) {
      setError(errText(e, 'That code was not valid.'))
    }
  }

  const data = status.data
  const enabled = data?.totp.enabled === true

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Two factor</h1>
        <p className="text-muted-foreground text-sm">
          Add an authenticator app so sign-ins need a code as well as your
          password.
        </p>
      </div>

      <FormError
        message={error ?? errText(status.error, 'Could not load your status.')}
      />

      {codes ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Save your recovery codes</p>
          <p className="text-muted-foreground text-xs">
            Each code works once if you lose your authenticator. Store them
            somewhere safe. They will not be shown again.
          </p>
          <div className="grid grid-cols-2 gap-1 font-mono text-sm">
            {codes.map(c => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => setCodes(null)}>
            Done
          </Button>
        </div>
      ) : null}

      {status.isLoading || sudo.loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : mode === 'view' ? (
        <div className="space-y-3">
          <p className="text-sm">
            Authenticator app is{' '}
            <span className="font-medium">{enabled ? 'on' : 'off'}</span>.
            {enabled && data
              ? ` ${data.recoveryCodesRemaining} recovery codes remaining.`
              : ''}
          </p>
          {enabled ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => start('regen')}
                loading={busy && action === 'regen'}
              >
                Regenerate recovery codes
              </Button>
              <Button
                variant="destructive"
                onClick={() => start('disable')}
                loading={busy && action === 'disable'}
              >
                Turn off
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => start('enrol')}
              loading={busy && action === 'enrol'}
            >
              Set up authenticator app
            </Button>
          )}
        </div>
      ) : mode === 'enrolCode' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm">
              Add this key to your authenticator app, then enter the 6 digit
              code it shows.
            </p>
            <code className="bg-muted block rounded px-2 py-1 font-mono text-sm break-all">
              {secret}
            </code>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={totpConfirm.isPending}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={confirmEnrol}
              loading={totpConfirm.isPending}
              disabled={!code}
            >
              Verify and turn on
            </Button>
            <Button
              variant="ghost"
              onClick={toView}
              disabled={totpConfirm.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">Confirm your password</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={authorize}
              loading={busy}
              disabled={!password}
              variant={action === 'disable' ? 'destructive' : 'default'}
            >
              Continue
            </Button>
            <Button variant="ghost" onClick={toView} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
