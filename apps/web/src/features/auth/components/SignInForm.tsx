'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/Form'
import { Button } from '@/components/ui/button'
import { useLogin } from '../hooks/useAuthMutations'
import { useAuth } from '../context/AuthContext'
import { signInSchema, type SignInValues } from '../schemas/sign-in.schema'
import { isStepUp } from '../types'
import { TextField } from './TextField'
import { PasswordField } from './PasswordField'
import { FormError } from './FormError'
import { PasskeyAutofill } from './PasskeyAutofill'
import { GoogleButton } from './GoogleButton'
import { Turnstile } from './Turnstile'
import { env } from '@/config/env'
import { safeNextPath } from '@/lib/next-path'

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter()
  const { setSession } = useAuth()
  const { mutate, isPending, isSuccess, error } = useLogin()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const lockRef = useRef(false)
  const awaitingCaptcha = env.captcha.enabled && !captchaToken
  const busy = locked || isPending || isSuccess
  const formDisabled = awaitingCaptcha || busy

  const acquire = () => {
    if (lockRef.current) return false
    lockRef.current = true
    setLocked(true)
    return true
  }
  const release = () => {
    lockRef.current = false
    setLocked(false)
  }

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: SignInValues) {
    if (awaitingCaptcha) return
    if (!acquire()) return
    mutate(
      { ...values, captchaToken: captchaToken ?? undefined },
      {
        onSuccess: res => {
          if (isStepUp(res)) {
            const params = new URLSearchParams({
              challengeId: res.challengeId,
              method: res.method,
              methods: res.availableMethods.join(','),
              email: values.email,
            })
            if (next) params.set('next', next)
            router.push(`/sign-in/challenge?${params.toString()}`)
            return
          }
          setSession(res.accessToken, { email: values.email })
          router.push(safeNextPath(next))
        },
        onError: () => {
          release()
          setCaptchaKey(k => k + 1)
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormError message={error?.message} />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="username webauthn"
          placeholder="you@example.com"
          disabled={formDisabled}
        />
        <PasswordField
          control={form.control}
          name="password"
          label="Password"
          autoComplete="current-password"
          disabled={formDisabled}
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-sm underline"
          >
            Forgot password?
          </Link>
        </div>
        <Turnstile
          onToken={token => {
            setCaptchaToken(token)
            if (token) setCaptchaError(null)
          }}
          onError={() =>
            setCaptchaError(
              'Couldn’t load verification. Disable any ad blocker or refresh the page.'
            )
          }
          resetKey={captchaKey}
        />
        <FormError message={captchaError} />
        <Button
          type="submit"
          className="w-full"
          disabled={formDisabled}
          loading={isPending || isSuccess}
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>
        <GoogleButton disabled={busy} onStart={acquire} />
        <PasskeyAutofill
          next={next}
          disabled={busy}
          onStart={acquire}
          onStop={release}
        />
      </form>
    </Form>
  )
}
