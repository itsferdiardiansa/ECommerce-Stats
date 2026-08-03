'use client'

import { useEffect, useState } from 'react'
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
import { FormError } from '@/features/auth/components/FormError'

export function SudoPrompt({
  open,
  onAuthorize,
  onCancel,
}: {
  open: boolean
  onAuthorize: (password: string) => Promise<void>
  onCancel: () => void
}) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPassword('')
      setError(null)
      setBusy(false)
    }
  }, [open])

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onAuthorize(password)
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Could not confirm. Check your password.'
      )
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next && !busy) onCancel()
      }}
    >
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={e => {
            e.preventDefault()
            if (password && !busy) confirm()
          }}
        >
          <DialogHeader>
            <DialogTitle>Confirm it&apos;s you</DialogTitle>
            <DialogDescription>
              Enter your password to continue with this action.
            </DialogDescription>
          </DialogHeader>
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="sudo-prompt-password">Password</Label>
            <Input
              id="sudo-prompt-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" loading={busy} disabled={!password}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
