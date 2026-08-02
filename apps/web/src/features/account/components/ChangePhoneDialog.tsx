'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
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

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback

const EXPIRED = 'Your confirmation expired. Please enter your password again.'

export function ChangePhoneDialog({
  open,
  onOpenChange,
  currentPhone,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPhone: string | null
  onSave: (phone: string | null) => Promise<void>
}) {
  const sudo = useSudo()
  const [step, setStep] = useState<'sudo' | 'form'>('sudo')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const opened = useRef(false)

  useEffect(() => {
    if (!open) {
      opened.current = false
      return
    }
    if (sudo.loading) return
    if (!opened.current) {
      opened.current = true
      setError(null)
      if (sudo.isValid) {
        setPhone(currentPhone ?? '')
        setStep('form')
      } else {
        setStep('sudo')
      }
      return
    }
    if (!sudo.isValid && step === 'form') {
      setStep('sudo')
      setError(EXPIRED)
    }
  }, [open, sudo.loading, sudo.isValid, step, currentPhone])

  function reset() {
    setStep('sudo')
    setPassword('')
    setPhone(currentPhone ?? '')
    setError(null)
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
      setPhone(currentPhone ?? '')
      setStep('form')
    } catch (e) {
      setError(errText(e, 'Could not confirm. Check your password.'))
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!sudo.isValid) {
      setStep('sudo')
      setError(EXPIRED)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave(phone.trim() || null)
      close(false)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUDO_REQUIRED') {
        sudo.invalidate()
        setStep('sudo')
        setError(EXPIRED)
      } else {
        setError(errText(e, 'Could not save your phone number.'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change phone number</DialogTitle>
          <DialogDescription>
            {step === 'sudo'
              ? 'Enter your password to continue.'
              : 'Enter the phone number for your account.'}
          </DialogDescription>
        </DialogHeader>

        <FormError message={error ?? sudo.error} />

        {sudo.loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : step === 'sudo' ? (
          <div className="space-y-2">
            <Label htmlFor="phone-password">Password</Label>
            <Input
              id="phone-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="new-phone">Phone number</Label>
            <Input
              id="new-phone"
              type="tel"
              placeholder="Optional"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={busy}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} disabled={busy}>
            Cancel
          </Button>
          {sudo.loading ? null : step === 'sudo' ? (
            <Button onClick={authorize} loading={busy} disabled={!password}>
              Continue
            </Button>
          ) : (
            <Button onClick={submit} loading={busy}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
