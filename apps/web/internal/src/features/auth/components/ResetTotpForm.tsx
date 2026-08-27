'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  ErrorState,
  Form,
  FormField,
  Input,
  toast,
} from '@rufieltics/ui'
import { authApi } from '@/features/auth/api'
import { resetTotpSchema, type ResetTotpValues } from '@/features/auth/schemas'
import { digitsOnly } from '@/lib/format'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'
import { AuthenticatorQr } from './AuthenticatorQr'

interface LoadError {
  title: string
  description: string
  canRetry: boolean
}

export function ResetTotpForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''

  const [enroll, setEnroll] = useState<{
    otpauthUri: string
    secret: string
  } | null>(null)
  const [loadError, setLoadError] = useState<LoadError | null>(null)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const nextSignal = useAbortSignal()

  const form = useForm<ResetTotpValues>({
    resolver: zodResolver(resetTotpSchema),
    defaultValues: { code: '' },
  })

  const load = useCallback(() => {
    if (!token) {
      setLoadError({
        title: 'Reset link is broken',
        description:
          'This link is missing its token. Request a new reset from the sign-in screen.',
        canRetry: false,
      })
      return
    }
    setLoadError(null)
    setEnroll(null)
    authApi
      .beginTotpReset(token, nextSignal())
      .then(res => {
        if (!res?.otpauthUri || !res?.secret) {
          setLoadError({
            title: 'Reset link expired',
            description:
              'This reset link is invalid or has expired. Head back and request a new one.',
            canRetry: false,
          })
          return
        }
        setEnroll({ otpauthUri: res.otpauthUri, secret: res.secret })
      })
      .catch(err => {
        if (isSilentError(err)) return
        setLoadError({
          title: "Couldn't prepare your reset",
          description:
            err instanceof Error
              ? err.message
              : 'Something went wrong while preparing your authenticator.',
          canRetry: true,
        })
      })
  }, [token, nextSignal])

  useEffect(() => {
    load()
  }, [load])

  const submit = async () => {
    if (!(await form.trigger())) return
    setApiError('')
    setLoading(true)
    try {
      await authApi.confirmTotpReset(
        token,
        form.getValues('code'),
        nextSignal()
      )
      toast.success('Your authenticator has been reset. Sign in again.')
      setDone(true)
      router.push('/sign-in')
    } catch (err) {
      if (isSilentError(err)) return
      setApiError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit()
  }

  if (loadError) {
    return (
      <Card className="w-full max-w-sm">
        <Card.Content className="space-y-3 p-2">
          <ErrorState
            title={loadError.title}
            description={loadError.description}
            onRetry={loadError.canRetry ? load : undefined}
          />
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/sign-in')}
          >
            Back to sign in
          </Button>
        </Card.Content>
      </Card>
    )
  }

  if (!enroll) {
    return (
      <Card className="w-full max-w-sm">
        <Card.Content className="text-muted-foreground flex flex-col items-center gap-3 py-10 text-center text-sm">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          Preparing your new authenticator…
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <Card.Header>
        <div className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold">Reset authenticator</span>
          <span className="text-muted-foreground text-sm">
            Scan the new QR code, then enter the code to confirm.
          </span>
        </div>
      </Card.Header>
      <Card.Content>
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
              <AuthenticatorQr
                otpauthUri={enroll.otpauthUri}
                secret={enroll.secret}
              />
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
                Confirm reset
              </Button>
            </fieldset>
          </form>
        </Form>
      </Card.Content>
    </Card>
  )
}
