'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api-client'
import { useSudo } from '@/features/account/context/SudoContext'
import { useChangePassword } from '@/features/account/hooks/useAccountMutations'
import { FormError } from '@/features/auth/components/FormError'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback

const EXPIRED = 'Your confirmation expired. Please enter your password again.'

export default function PasswordPage() {
  const sudo = useSudo()
  const changePasswordMutation = useChangePassword()
  const [step, setStep] = useState<'sudo' | 'change'>(
    sudo.isValid ? 'change' : 'sudo'
  )
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (sudo.isValid && step === 'sudo') {
      setStep('change')
      setError(null)
    } else if (!sudo.isValid && step === 'change') {
      setStep('sudo')
      setError(EXPIRED)
    }
  }, [sudo.isValid, step])

  async function authorize(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await sudo.authorize(current)
      setCurrent('')
      setStep('change')
    } catch (err) {
      setError(errText(err, 'Could not confirm. Check your password.'))
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (next !== confirm) {
      setError('The new passwords do not match.')
      return
    }
    if (!sudo.isValid) {
      setStep('sudo')
      setError(EXPIRED)
      return
    }
    setBusy(true)
    try {
      await changePasswordMutation.mutateAsync(next)
      setDone(true)
      setNext('')
      setConfirm('')
      sudo.invalidate()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SUDO_REQUIRED') {
        sudo.invalidate()
        setStep('sudo')
        setError(EXPIRED)
      } else {
        setError(errText(err, 'Could not change your password.'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Password</h1>
        <p className="text-muted-foreground text-sm">
          Change your password. Every other device is signed out afterwards.
        </p>
      </div>

      {done ? (
        <p
          role="status"
          className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
        >
          Your password has been changed.
        </p>
      ) : null}

      {sudo.loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : step === 'sudo' ? (
        <form onSubmit={authorize} className="space-y-4" noValidate>
          <FormError message={error ?? sudo.error} />
          <div className="space-y-2">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              disabled={busy}
            />
          </div>
          <Button type="submit" loading={busy} disabled={!current}>
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={changePassword} className="space-y-4" noValidate>
          <FormError message={error ?? sudo.error} />
          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input
              id="next"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={e => setNext(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              disabled={busy}
            />
          </div>
          <Button type="submit" loading={busy} disabled={!next || !confirm}>
            Change password
          </Button>
        </form>
      )}
    </div>
  )
}
