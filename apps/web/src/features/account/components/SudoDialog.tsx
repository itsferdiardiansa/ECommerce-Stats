'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
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
import { FormError } from '@/features/auth/components/FormError'

export function SudoDialog({
  open,
  onOpenChange,
  onConfirmed,
  title = 'Confirm your identity',
  description = 'Enter your password to continue.',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmed: () => Promise<void>
  title?: string
  description?: string
}) {
  const sudo = useSudo()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setPassword('')
      setError(null)
    }
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await sudo.authorize(password)
      await onConfirmed()
      close(false)
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Could not confirm. Check your password.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        <div className="space-y-2">
          <Label htmlFor="sudo-password">Password</Label>
          <Input
            id="sudo-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={busy}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={confirm} loading={busy} disabled={!password}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
