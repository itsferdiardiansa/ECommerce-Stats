'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { CodeInput } from '@/components/ui/CodeInput'
import { Loading } from '@/components/ui/Loading'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/lib/api-client'
import { useSudo } from '@/features/account/context/SudoContext'
import {
  useConfirmEmailChange,
  useRequestEmailChange,
} from '@/features/account/hooks/useAccountMutations'
import { FormError } from '@/features/auth/components/FormError'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback

const EXPIRED = 'Your confirmation expired. Please enter your password again.'

export function ChangeEmailDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const sudo = useSudo()
  const requestChange = useRequestEmailChange()
  const confirmChange = useConfirmEmailChange()
  const [step, setStep] = useState<'sudo' | 'form' | 'code'>('sudo')
  const [password, setPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const opened = useRef(false)
  const retry = useRef<null | (() => Promise<void>)>(null)
  const pending = busy || requestChange.isPending || confirmChange.isPending

  useEffect(() => {
    if (!open) {
      opened.current = false
      return
    }
    if (opened.current) return
    opened.current = true
    setError(null)
    setChecking(true)
    sudo.checkSudo().then(active => {
      setStep(active ? 'form' : 'sudo')
      setChecking(false)
    })
  }, [open, sudo])

  function reset() {
    setStep('sudo')
    setPassword('')
    setNewEmail('')
    setConfirmEmail('')
    setCode('')
    setError(null)
    retry.current = null
  }

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) reset()
  }

  async function authorize() {
    setBusy(true)
    setError(null)
    try {
      await sudo.authorize(password)
      setPassword('')
      const resume = retry.current
      retry.current = null
      if (resume) {
        await resume()
      } else {
        setStep('form')
      }
    } catch (e) {
      setError(errText(e, 'Could not confirm. Check your password.'))
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (newEmail !== confirmEmail) {
      setError('The email addresses do not match.')
      return
    }
    setError(null)
    try {
      await requestChange.mutateAsync(newEmail)
      setStep('code')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUDO_REQUIRED') {
        retry.current = submit
        setStep('sudo')
        setError(EXPIRED)
      } else {
        setError(errText(e, 'Could not start the change. Try again.'))
      }
    }
  }

  async function confirm() {
    setError(null)
    try {
      await confirmChange.mutateAsync(code)
      close(false)
    } catch (e) {
      setError(errText(e, 'That code was not valid.'))
    }
  }

  function onPrimary() {
    if (checking || pending) return
    if (step === 'sudo') {
      if (password) authorize()
    } else if (step === 'form') {
      if (newEmail && confirmEmail) submit()
    } else if (code) {
      confirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={e => {
            e.preventDefault()
            onPrimary()
          }}
        >
          <DialogHeader>
            <DialogTitle>Change email address</DialogTitle>
            <DialogDescription>
              {step === 'sudo'
                ? 'Enter your password to continue.'
                : step === 'code'
                  ? `Enter the 6 digit code we sent to ${newEmail}.`
                  : 'Enter the new email address for your account.'}
            </DialogDescription>
          </DialogHeader>

          <FormError message={error} />

          {checking ? (
            <Loading className="py-6" />
          ) : step === 'sudo' ? (
            <div className="space-y-2">
              <Label htmlFor="email-password">Password</Label>
              <Input
                id="email-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={pending}
              />
            </div>
          ) : step === 'form' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">New email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-email">Confirm email</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={e => setConfirmEmail(e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email-code">Code</Label>
              <CodeInput
                id="email-code"
                placeholder="123456"
                value={code}
                onValueChange={setCode}
                disabled={pending}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => close(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            {checking ? null : step === 'sudo' ? (
              <Button type="submit" loading={busy} disabled={!password}>
                Continue
              </Button>
            ) : step === 'form' ? (
              <Button
                type="submit"
                loading={requestChange.isPending}
                disabled={!newEmail || !confirmEmail}
              >
                Save
              </Button>
            ) : (
              <Button
                type="submit"
                loading={confirmChange.isPending}
                disabled={!code}
              >
                Confirm
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
