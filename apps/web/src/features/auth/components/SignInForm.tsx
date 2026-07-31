'use client'

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

export function SignInForm() {
  const router = useRouter()
  const { setSession } = useAuth()
  const { mutate, isPending, isSuccess, error } = useLogin()

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: SignInValues) {
    mutate(values, {
      onSuccess: res => {
        if (isStepUp(res)) {
          const params = new URLSearchParams({
            challengeId: res.challengeId,
            method: res.method,
            methods: res.availableMethods.join(','),
            email: values.email,
          })
          router.push(`/sign-in/challenge?${params.toString()}`)
          return
        }
        setSession(res.accessToken, { email: values.email })
        router.push('/security')
      },
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
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="username webauthn"
          placeholder="you@example.com"
        />
        <PasswordField
          control={form.control}
          name="password"
          label="Password"
          autoComplete="current-password"
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-sm underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={isPending || isSuccess}
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>
        <GoogleButton />
        <PasskeyAutofill />
      </form>
    </Form>
  )
}
