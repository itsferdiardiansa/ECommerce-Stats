'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/Loading'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import { phoneChars } from '@/lib/sanitize'
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
  const [checking, setChecking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const opened = useRef(false)
  const retry = useRef<null | (() => Promise<void>)>(null)

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
      if (active) {
        setPhone(currentPhone ?? '')
        setStep('form')
      } else {
        setStep('sudo')
      }
      setChecking(false)
    })
  }, [open, sudo, currentPhone])

  function reset() {
    setStep('sudo')
    setPassword('')
    setPhone(currentPhone ?? '')
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
        setPhone(currentPhone ?? '')
        setStep('form')
      }
    } catch (e) {
      setError(errText(e, 'Could not confirm. Check your password.'))
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await onSave(phone.trim() || null)
      close(false)
      toast.success('Phone number updated.')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUDO_REQUIRED') {
        retry.current = submit
        setStep('sudo')
        setError(EXPIRED)
      } else {
        setError(errText(e, 'Could not save your phone number.'))
      }
    } finally {
      setBusy(false)
    }
  }

  function onPrimary() {
    if (checking || busy) return
    if (step === 'sudo') {
      if (password) authorize()
    } else {
      submit()
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
            <DialogTitle>Change phone number</DialogTitle>
            <DialogDescription>
              {step === 'sudo'
                ? 'Enter your password to continue.'
                : 'Enter the phone number for your account.'}
            </DialogDescription>
          </DialogHeader>

          <FormError message={error} />

          {checking ? (
            <Loading className="py-6" />
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
                inputMode="tel"
                placeholder="Optional"
                value={phone}
                onChange={e => setPhone(phoneChars(e.target.value))}
                disabled={busy}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => close(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            {checking ? null : step === 'sudo' ? (
              <Button type="submit" loading={busy} disabled={!password}>
                Continue
              </Button>
            ) : (
              <Button type="submit" loading={busy}>
                Save
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
