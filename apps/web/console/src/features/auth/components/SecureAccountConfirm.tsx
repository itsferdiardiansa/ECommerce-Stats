'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import { authApi } from '../api/auth.api'
import { FormError } from './FormError'

export function SecureAccountConfirm({ token }: { token: string }) {
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onConfirm() {
    setError(null)
    setPending(true)
    try {
      await authApi.secureAccount({ token })
      setDone(true)
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'This security link is invalid or has expired.'
      )
      setPending(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p
          role="status"
          className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
        >
          Your account is locked and every device has been signed out. Check
          your email for a link to reset your password and sign back in.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <FormError message={error} />
        <p className="text-muted-foreground text-sm">
          This link may have already been used or expired. If you&rsquo;re still
          worried about your account, reset your password now - it signs out
          every device and locks out anyone who knew your old password.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Reset your password</Link>
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Still need help? Contact support.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={onConfirm} loading={pending}>
        Yes, secure my account
      </Button>
    </div>
  )
}
