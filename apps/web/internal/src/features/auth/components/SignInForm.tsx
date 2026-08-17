'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
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
  toast,
} from '@rufieltics/ui'
import { useAuth } from '@/features/auth/context'
import { authApi } from '@/features/auth/api'
import { signInSchema, type SignInValues } from '@/features/auth/schemas'
import { digitsOnly } from '@/lib/format'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'
import { AuthenticatorQr } from './AuthenticatorQr'

type Step = 'password' | 'mfa' | 'reset'
interface Enroll {
  otpauthUri: string
  secret: string
}

export function SignInForm() {
  const router = useRouter()
  const { login, verifyMfa } = useAuth()
  const [step, setStep] = useState<Step>('password')
  const [mfaToken, setMfaToken] = useState('')
  const [enroll, setEnroll] = useState<Enroll | null>(null)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const nextSignal = useAbortSignal()

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', code: '' },
  })

  const submitPassword = async () => {
    if (!(await form.trigger(['email', 'password']))) return
    setApiError('')
    setLoading(true)
    try {
      const result = await login(
        form.getValues('email'),
        form.getValues('password'),
        nextSignal()
      )
      setMfaToken(result.mfaToken)
      const canEnroll =
        result.enrollRequired && result.otpauthUri && result.secret
      setEnroll(
        canEnroll
          ? { otpauthUri: result.otpauthUri!, secret: result.secret! }
          : null
      )
      setStep('mfa')
    } catch (err) {
      if (isSilentError(err)) return
      setApiError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const submitMfa = async () => {
    if (!(await form.trigger(['code']))) return
    setApiError('')
    setLoading(true)
    try {
      await verifyMfa(mfaToken, form.getValues('code'), nextSignal())
      setDone(true)
      router.push('/')
    } catch (err) {
      if (isSilentError(err)) return
      setApiError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const requestReset = async () => {
    if (!(await form.trigger(['email']))) return
    setApiError('')
    setLoading(true)
    try {
      await authApi.requestTotpReset(form.getValues('email'), nextSignal())
      toast.success('If that account exists, a reset link is on its way.')
      setStep('password')
      form.resetField('code')
    } catch (err) {
      if (isSilentError(err)) return
      setApiError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const stepAction: Record<Step, () => Promise<void>> = {
    password: submitPassword,
    mfa: submitMfa,
    reset: requestReset,
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void stepAction[step]()
  }

  const backToSignIn = () => {
    setStep('password')
    setEnroll(null)
    setApiError('')
    form.resetField('code')
  }

  const showResetStep = () => {
    setStep('reset')
    setApiError('')
  }

  const stepDescription = () => {
    if (step === 'password') return 'Sign in to the internal console.'
    if (step === 'reset') {
      return 'Enter your email and we will send a link to reset your authenticator.'
    }
    return enroll
      ? 'Set up your authenticator, then enter the 6-digit code to finish.'
      : 'Enter the 6-digit code from your authenticator app.'
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>@rufieltics Admin</CardTitle>
        <CardDescription>{stepDescription()}</CardDescription>
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
                  <FormField name="email" label="Email">
                    <Input type="email" autoComplete="username" />
                  </FormField>
                  <FormField name="password" label="Password">
                    <Input type="password" autoComplete="current-password" />
                  </FormField>
                  <Button type="submit" className="w-full" loading={loading}>
                    Continue
                  </Button>
                </>
              ) : step === 'reset' ? (
                <>
                  <FormField name="email" label="Email">
                    <Input type="email" autoComplete="username" />
                  </FormField>
                  <Button type="submit" className="w-full" loading={loading}>
                    Send reset link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={backToSignIn}
                  >
                    Back to sign in
                  </Button>
                </>
              ) : (
                <>
                  {enroll ? (
                    <AuthenticatorQr
                      otpauthUri={enroll.otpauthUri}
                      secret={enroll.secret}
                    />
                  ) : null}
                  <FormField
                    name="code"
                    label="Authenticator code"
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
                    {enroll ? 'Confirm & sign in' : 'Verify & sign in'}
                  </Button>
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={backToSignIn}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={showResetStep}
                    >
                      Reset authenticator
                    </Button>
                  </div>
                </>
              )}
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
