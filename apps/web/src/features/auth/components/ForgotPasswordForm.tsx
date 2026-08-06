'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { useForgotPassword } from '../hooks/useAuthMutations'
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '../schemas/forgot-password.schema'
import { TextField } from './TextField'
import { FormError } from './FormError'

const LINK_VALIDITY_MINUTES = 15

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

export function ForgotPasswordForm() {
  const { mutate, isPending, error, data } = useForgotPassword()
  const [cooldown, setCooldown] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(
      () => setCooldown(c => (c <= 1 ? 0 : c - 1)),
      1000
    )
    return () => clearInterval(timer)
  }, [cooldown])

  function send(email: string) {
    mutate(
      { email },
      {
        onSuccess: res => {
          setSubmitted(true)
          setCooldown(res.retryAfterSeconds)
        },
      }
    )
  }

  if (submitted) {
    const escalated = !!data && (data.throttled || data.retryAfterSeconds > 60)

    return (
      <div className="space-y-4">
        {escalated ? (
          <p
            role="alert"
            className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
          >
            You&apos;ve requested a password reset several times. Please wait{' '}
            {formatWait(cooldown)} before requesting another link.
          </p>
        ) : (
          <p
            role="status"
            className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
          >
            If an account exists for that email, we&apos;ve sent a link to reset
            your password. Check your inbox — the link expires in{' '}
            {LINK_VALIDITY_MINUTES} minutes.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => send(form.getValues('email'))}
          disabled={cooldown > 0 || isPending}
          aria-busy={isPending}
        >
          {cooldown > 0
            ? `Resend in ${formatWait(cooldown)}`
            : isPending
              ? 'Sending…'
              : "Didn't get it? Resend email"}
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(v => send(v.email))}
        noValidate
        className="space-y-4"
      >
        <FormError message={error?.message} />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? 'Sending…' : 'Send reset instructions'}
        </Button>
      </form>
    </Form>
  )
}
