import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { SignInForm } from '@/features/auth/components/SignInForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string; reset?: string }>
}) {
  const { verified, error, reset } = await searchParams

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back. Enter your details to continue."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="text-foreground font-medium underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {verified ? (
        <p
          role="status"
          className="mb-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
        >
          Your email is verified. You can sign in now.
        </p>
      ) : null}
      {reset ? (
        <p
          role="status"
          className="mb-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
        >
          Your password has been reset. Sign in with your new password.
        </p>
      ) : null}
      {error === 'oauth' ? (
        <p
          role="alert"
          className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400"
        >
          We couldn&apos;t complete Google sign-in. Please try again.
        </p>
      ) : null}
      {error === 'locked' ? (
        <p
          role="alert"
          className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400"
        >
          This account has been locked for security. Check your email for a link
          to reset your password and sign back in.
        </p>
      ) : null}
      <SignInForm />
    </AuthCard>
  )
}
