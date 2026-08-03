'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/Form'
import { Button } from '@/components/ui/button'
import {
  useResendVerification,
  useVerifyEmail,
} from '../hooks/useAuthMutations'
import {
  verifyEmailSchema,
  type VerifyEmailValues,
} from '../schemas/verify-email.schema'
import { TextField } from './TextField'
import { FormError } from './FormError'
import { digitsOnly } from '@/lib/sanitize'

export function VerifyEmailForm({
  defaultEmail = '',
}: {
  defaultEmail?: string
}) {
  const router = useRouter()
  const verify = useVerifyEmail()
  const resend = useResendVerification()

  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: defaultEmail, code: '' },
  })

  const email = form.watch('email')

  function onSubmit(values: VerifyEmailValues) {
    verify.mutate(values, {
      onSuccess: () => router.push('/sign-in?verified=1'),
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormError message={verify.error?.message} />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="code"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          description="Enter the 6-digit code we emailed you."
          sanitize={v => digitsOnly(v, 6)}
        />
        <Button
          type="submit"
          className="w-full"
          loading={verify.isPending || verify.isSuccess}
        >
          {verify.isPending ? 'Verifying…' : 'Verify email'}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={resend.isPending || !email}
            aria-busy={resend.isPending}
            onClick={() => resend.mutate(email)}
          >
            {resend.isPending ? 'Sending…' : "Didn't get it? Resend code"}
          </Button>
          <div aria-live="polite" className="text-muted-foreground text-sm">
            {resend.isSuccess ? 'A new code has been sent.' : null}
          </div>
        </div>
      </form>
    </Form>
  )
}
