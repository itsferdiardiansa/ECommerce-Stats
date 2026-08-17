'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  Input,
} from '@rufieltics/ui'
import { authApi } from '@/features/auth/api'
import { setupSchema, type SetupValues } from '@/features/auth/schemas'
import { digitsOnly } from '@/lib/format'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'
import { AuthenticatorQr } from './AuthenticatorQr'

export function SetupForm() {
  const params = useSearchParams()
  const inviteToken = params.get('token') ?? ''

  const [step, setStep] = useState<'password' | 'mfa'>('password')
  const [secret, setSecret] = useState('')
  const [otpauthUri, setOtpauthUri] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [gate, setGate] = useState<
    'checking' | 'invalid' | 'completed' | 'form'
  >('checking')

  const nextSignal = useAbortSignal()

  useEffect(() => {
    let active = true
    if (!inviteToken) {
      setGate('invalid')
      return
    }
    authApi
      .setupStatus(inviteToken)
      .then(res => {
        if (!active) return
        if (res.status === 'invalid') return setGate('invalid')
        if (res.status === 'completed') return setGate('completed')
        if (res.staged) {
          setSecret(res.secret)
          setOtpauthUri(res.otpauthUri)
          setStep('mfa')
        }
        setGate('form')
      })
      // A transient failure shouldn't lock the invitee out - fall back to the
      // form, which re-validates the token on submit anyway.
      .catch(() => {
        if (active) setGate('form')
      })
    return () => {
      active = false
    }
  }, [inviteToken])

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { password: '', confirm: '', code: '' },
  })

  const submit = async () => {
    setApiError('')
    if (step === 'password') {
      if (!(await form.trigger(['password', 'confirm']))) return
      setLoading(true)
      try {
        const res = await authApi.setup(
          inviteToken,
          form.getValues('password'),
          nextSignal()
        )
        setSecret(res.secret)
        setOtpauthUri(res.otpauthUri)
        setStep('mfa')
      } catch (err) {
        if (isSilentError(err)) return
        setApiError(err instanceof Error ? err.message : 'Setup failed')
      } finally {
        setLoading(false)
      }
    } else {
      if (!(await form.trigger(['code']))) return
      setLoading(true)
      try {
        await authApi.confirmSetup(
          inviteToken,
          form.getValues('code'),
          nextSignal()
        )
        setDone(true)
      } catch (err) {
        if (isSilentError(err)) return
        setApiError(err instanceof Error ? err.message : 'Verification failed')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit()
  }

  if (gate === 'checking') {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2
            className="text-muted-foreground size-6 animate-spin"
            aria-hidden
          />
        </CardContent>
      </Card>
    )
  }

  if (gate === 'invalid') {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <CircleAlert className="text-muted-foreground size-12" aria-hidden />
          <div className="space-y-1">
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              This invitation is invalid or has expired. Ask an administrator to
              send you a new one.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gate === 'completed') {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
          <div className="space-y-1">
            <CardTitle>Your account is already set up</CardTitle>
            <CardDescription>Sign in to reach your dashboard.</CardDescription>
          </div>
          <Button asChild className="w-full">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
          <div className="space-y-1">
            <CardTitle>Your account is set</CardTitle>
            <CardDescription>
              You&apos;re all set - sign in to reach your dashboard.
            </CardDescription>
          </div>
          <Button asChild className="w-full">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set up your account</CardTitle>
        <CardDescription>
          {step === 'password'
            ? 'Choose a password (at least 12 characters).'
            : 'Scan the QR code with your authenticator app, then enter the code.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <fieldset
              disabled={loading || done}
              className="m-0 min-w-0 space-y-4 border-0 p-0"
            >
              {step === 'password' ? (
                <>
                  <FormField name="password" label="Password">
                    <Input type="password" autoComplete="new-password" />
                  </FormField>
                  <FormField name="confirm" label="Confirm password">
                    <Input type="password" autoComplete="new-password" />
                  </FormField>
                  <Button type="submit" className="w-full" loading={loading}>
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <AuthenticatorQr otpauthUri={otpauthUri} secret={secret} />
                  <FormField
                    name="code"
                    label="6-digit code"
                    transform={digitsOnly}
                  >
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                    />
                  </FormField>
                  <Button
                    type="submit"
                    className="w-full"
                    loading={loading || done}
                  >
                    Activate account
                  </Button>
                </>
              )}
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
