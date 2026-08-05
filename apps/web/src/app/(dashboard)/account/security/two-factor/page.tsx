'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { CodeInput } from '@/components/ui/CodeInput'
import { Loading } from '@/components/ui/Loading'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CopyableCode } from '@/features/account/components/CopyableCode'
import {
  SudoCancelledError,
  useSudo,
} from '@/features/account/context/SudoContext'
import { useMfaStatus } from '@/features/account/hooks/useAccountQueries'
import {
  useRegenerateRecoveryCodes,
  useTotpBegin,
  useTotpConfirm,
  useTotpDisable,
} from '@/features/account/hooks/useAccountMutations'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'

type Mode = 'view' | 'enrolCode'
type Action = 'enrol' | 'disable' | 'regen'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

export default function TwoFactorPage() {
  const sudo = useSudo()
  const status = useMfaStatus()
  const totpBegin = useTotpBegin()
  const totpConfirm = useTotpConfirm()
  const totpDisable = useTotpDisable()
  const regen = useRegenerateRecoveryCodes()

  const [mode, setMode] = useState<Mode>('view')
  const [action, setAction] = useState<Action>('enrol')
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [otpauth, setOtpauth] = useState<string | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toView() {
    setMode('view')
    setCode('')
    setSecret(null)
    setOtpauth(null)
    setError(null)
  }

  async function runAction(which: Action) {
    if (which === 'enrol') {
      const res = await totpBegin.mutateAsync()
      setSecret(res.secret)
      setOtpauth(res.otpauthUri)
      setMode('enrolCode')
      return
    }
    if (which === 'disable') {
      await totpDisable.mutateAsync()
      toView()
      toast.success('Two-factor authentication turned off.')
      return
    }
    const res = await regen.mutateAsync()
    setCodes(res.recoveryCodes)
    toView()
    toast.success('Recovery codes regenerated.')
  }

  async function start(which: Action) {
    setError(null)
    setAction(which)
    setBusy(true)
    try {
      await sudo.perform(() => runAction(which))
    } catch (e) {
      if (!(e instanceof SudoCancelledError)) {
        setError(errText(e, 'Could not complete that action.'))
      }
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnrol() {
    setError(null)
    try {
      const res = await sudo.perform(() => totpConfirm.mutateAsync(code))
      setCodes(res.recoveryCodes)
      toView()
      toast.success('Two-factor authentication enabled.')
    } catch (e) {
      if (!(e instanceof SudoCancelledError)) {
        setError(errText(e, 'That code was not valid.'))
      }
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

      {status.isLoading ? (
        <Loading className="py-6" />
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
          <div className="space-y-3">
            <p className="text-sm">
              Scan this QR code with your authenticator app, then enter the 6
              digit code it shows.
            </p>
            {otpauth ? (
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                aria-label="Enlarge QR code"
                className="focus-visible:ring-ring w-fit cursor-pointer rounded-lg border bg-white p-3 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:outline-none"
              >
                <QRCodeSVG value={otpauth} size={168} />
              </button>
            ) : null}
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                Can&apos;t scan it? Enter this key manually instead:
              </p>
              {secret ? <CopyableCode value={secret} /> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <CodeInput
              id="code"
              placeholder="123456"
              value={code}
              onValueChange={setCode}
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
      ) : null}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan QR code</DialogTitle>
            <DialogDescription>
              Point your authenticator app at this code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2">
            {otpauth ? (
              <div className="rounded-lg border bg-white p-4">
                <QRCodeSVG value={otpauth} size={288} />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
