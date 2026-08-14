'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { useResetPassword } from '../hooks/useAuthMutations'
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from '../schemas/reset-password.schema'
import { PasswordField } from './PasswordField'
import { FormError } from './FormError'

export function ResetPasswordForm({ defaultToken }: { defaultToken: string }) {
  const router = useRouter()
  const { mutate, isPending, isSuccess, error } = useResetPassword()
  const stripped = useRef(false)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: defaultToken, password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!defaultToken || stripped.current) return
    stripped.current = true
    window.history.replaceState(null, '', window.location.pathname)
  }, [defaultToken])

  function onSubmit(values: ResetPasswordValues) {
    const { confirmPassword: _confirm, ...payload } = values
    mutate(payload, {
      onSuccess: () => router.push('/sign-in?reset=1'),
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormError message={error?.message} />
        <PasswordField
          control={form.control}
          name="password"
          label="New password"
          autoComplete="new-password"
        />
        <PasswordField
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
        />
        <Button
          type="submit"
          className="w-full"
          loading={isPending || isSuccess}
        >
          {isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </Form>
  )
}
