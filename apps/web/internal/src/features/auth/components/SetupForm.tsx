'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  FormError,
  Input,
} from '@rufieltics/ui'
import { authApi } from '@/features/auth/api'
import { setupSchema, type SetupValues } from '@/features/auth/schemas'
import { digitsOnly } from '@/lib/format'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'
import { AuthenticatorQr } from './AuthenticatorQr'

export function SetupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const inviteToken = params.get('token') ?? ''

  const [step, setStep] = useState<'password' | 'mfa'>('password')
  const [secret, setSecret] = useState('')
  const [otpauthUri, setOtpauthUri] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const nextSignal = useAbortSignal()

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
        router.push('/sign-in')
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

  if (!inviteToken) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <FormError message="This setup link is missing its invite token." />
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
              disabled={loading}
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
                  <Button type="submit" className="w-full" loading={loading}>
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
