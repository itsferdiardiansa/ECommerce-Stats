'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/Form'
import { Button } from '@/components/ui/button'
import { useRegister } from '../hooks/useAuthMutations'
import { signUpSchema, type SignUpValues } from '../schemas/sign-up.schema'
import { TextField } from './TextField'
import { PasswordField } from './PasswordField'
import { FormError } from './FormError'
import { GoogleButton } from './GoogleButton'

export function SignUpForm() {
  const router = useRouter()
  const { mutate, isPending, error } = useRegister()

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  function onSubmit(values: SignUpValues) {
    const { confirmPassword: _confirm, ...payload } = values
    mutate(payload, {
      onSuccess: () => {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`)
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
          name="name"
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
        />
        <TextField
          control={form.control}
          name="username"
          label="Username"
          autoComplete="username"
          placeholder="ada"
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <PasswordField
          control={form.control}
          name="password"
          label="Password"
          autoComplete="new-password"
        />
        <PasswordField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>
        <GoogleButton label="Sign up with Google" />
      </form>
    </Form>
  )
}
