import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import { Button } from '@/components/ui/button'
import { isResetTokenValid } from '@/features/auth/api/auth.server'

export const metadata: Metadata = {
  title: 'Reset password',
  referrer: 'no-referrer',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const canReset = Boolean(token) && (await isResetTokenValid(token as string))

  return (
    <AuthCard
      title="Set a new password"
      description={
        canReset
          ? 'Choose a new password for your account.'
          : 'Reset links are single-use and expire after 15 minutes.'
      }
      footer={
        <Link href="/sign-in" className="text-foreground font-medium underline">
          Back to sign in
        </Link>
      }
    >
      {canReset ? (
        <ResetPasswordForm defaultToken={token as string} />
      ) : (
        <div className="space-y-4">
          <p
            role="alert"
            className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400"
          >
            {token
              ? 'This reset link is invalid or has expired.'
              : 'Open the reset link from your email to continue.'}{' '}
            Request a new one below.
          </p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a reset link</Link>
          </Button>
        </div>
      )}
    </AuthCard>
  )
}
