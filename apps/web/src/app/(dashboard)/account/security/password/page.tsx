'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { ApiError } from '@/lib/api-client'
import {
  SudoCancelledError,
  useSudo,
} from '@/features/account/context/SudoContext'
import { useChangePassword } from '@/features/account/hooks/useAccountMutations'
import { FormError } from '@/features/auth/components/FormError'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback

export default function PasswordPage() {
  const sudo = useSudo()
  const changePassword = useChangePassword()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmed = useRef(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (next !== confirm) {
      setError('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await sudo.perform(() => changePassword.mutateAsync(next), {
        force: !confirmed.current,
      })
      confirmed.current = false
      setNext('')
      setConfirm('')
      toast.success('Password changed. Other devices were signed out.')
    } catch (err) {
      if (err instanceof SudoCancelledError) return
      confirmed.current = true
      setError(errText(err, 'Could not change your password.'))
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

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={error} />
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
    </div>
  )
}
