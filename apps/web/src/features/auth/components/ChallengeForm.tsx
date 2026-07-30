'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { startAuthentication } from '@simplewebauthn/browser'
import { z } from 'zod'
import { Fingerprint } from 'lucide-react'
import { Form } from '@/components/ui/Form'
import { Button } from '@/components/ui/button'
import { authApi } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '@/lib/api-client'
import { TextField } from './TextField'
import { FormError } from './FormError'

const codeSchema = z.object({ code: z.string().min(1, 'Enter your code.') })
type CodeValues = z.infer<typeof codeSchema>

interface ChallengeFormProps {
  challengeId: string
  methods: string[]
  email: string
}

export function ChallengeForm({
  challengeId,
  methods,
  email,
}: ChallengeFormProps) {
  const router = useRouter()
  const { setSession } = useAuth()

  const hasPasskey = methods.includes('passkey')
  const hasTotp = methods.includes('totp')
  const hasEmail = methods.includes('email')
  const hasRecovery = methods.includes('recovery')

  const [useRecovery, setUseRecovery] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [passkeyPending, setPasskeyPending] = useState(false)

  const codeMethod: 'totp' | 'email' | 'recovery' = useRecovery
    ? 'recovery'
    : hasTotp
      ? 'totp'
      : 'email'

  const form = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })
  const [codeError, setCodeError] = useState<string | null>(null)

  function completeSession(accessToken: string) {
    setSession(accessToken, { email })
    router.push('/security')
  }

  async function onCodeSubmit(values: CodeValues) {
    setCodeError(null)
    try {
      const session = await authApi.stepUp({
        challengeId,
        code: values.code,
        method: codeMethod,
      })
      completeSession(session.accessToken)
    } catch (err) {
      setCodeError(
        err instanceof ApiError ? err.message : 'Something went wrong.'
      )
    }
  }

  async function onPasskey() {
    setPasskeyError(null)
    setPasskeyPending(true)
    try {
      const optionsJSON = await authApi.passkeyLoginOptions(challengeId)
      const response = await startAuthentication({ optionsJSON })
      const session = await authApi.passkeyLoginVerify({
        challengeId,
        response,
      })
      completeSession(session.accessToken)
    } catch (err) {
      if (err instanceof ApiError) {
        setPasskeyError(err.message)
      } else {
        // user cancelled / no credential / timeout
        setPasskeyError('Passkey sign-in was cancelled or unavailable.')
      }
      setPasskeyPending(false)
    }
  }

  const codeLabel =
    codeMethod === 'recovery'
      ? 'Recovery code'
      : codeMethod === 'email'
        ? 'Email code'
        : 'Authenticator code'

  return (
    <div className="space-y-6">
      {hasPasskey ? (
        <div className="space-y-2">
          <Button
            type="button"
            className="w-full"
            onClick={onPasskey}
            loading={passkeyPending}
          >
            {passkeyPending ? null : (
              <Fingerprint className="size-4" aria-hidden="true" />
            )}
            {passkeyPending ? 'Waiting for passkey…' : 'Sign in with a passkey'}
          </Button>
          <FormError message={passkeyError} />
        </div>
      ) : null}

      {hasPasskey && (hasTotp || hasEmail) ? (
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>
      ) : null}

      {hasTotp || hasEmail ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onCodeSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormError message={codeError} />
            <TextField
              control={form.control}
              name="code"
              label={codeLabel}
              inputMode={codeMethod === 'recovery' ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              placeholder={
                codeMethod === 'recovery' ? 'XXXX-XXXX-XX' : '123456'
              }
              description={
                codeMethod === 'email'
                  ? 'Enter the code we emailed you.'
                  : codeMethod === 'recovery'
                    ? 'Enter one of your saved recovery codes.'
                    : 'Enter the code from your authenticator app.'
              }
            />
            <Button
              type="submit"
              className="w-full"
              loading={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? 'Verifying…'
                : 'Verify and sign in'}
            </Button>

            {hasRecovery ? (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setUseRecovery(v => !v)
                    setCodeError(null)
                    form.reset({ code: '' })
                  }}
                >
                  {useRecovery
                    ? 'Use your authenticator code instead'
                    : 'Use a recovery code instead'}
                </Button>
              </div>
            ) : null}
          </form>
        </Form>
      ) : null}
    </div>
  )
}
