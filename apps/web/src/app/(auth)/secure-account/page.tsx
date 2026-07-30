import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { SecureAccountConfirm } from '@/features/auth/components/SecureAccountConfirm'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Secure your account',
  referrer: 'no-referrer',
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:6001/api/v1'

type SecureTokenState = 'valid' | 'already_secured' | 'invalid'

async function checkSecureToken(token: string): Promise<SecureTokenState> {
  try {
    const res = await fetch(`${API_URL}/auth/secure-account/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    })
    if (!res.ok) return 'invalid'
    const body = (await res.json()) as { data?: { state?: SecureTokenState } }
    return body?.data?.state ?? 'invalid'
  } catch {
    return 'invalid'
  }
}

const DESCRIPTIONS: Record<SecureTokenState, string> = {
  valid:
    "If you didn't recognize the recent activity, lock your account now. We'll sign out every device and email you a link to reset your password.",
  already_secured:
    'This account is already locked. Check your email for the link to reset your password and sign back in.',
  invalid: 'Security links are single-use and expire after 72 hours.',
}

export default async function SecureAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const state: SecureTokenState = token
    ? await checkSecureToken(token)
    : 'invalid'

  return (
    <AuthCard
      title="Secure your account"
      description={DESCRIPTIONS[state]}
      footer={
        <Link href="/sign-in" className="text-foreground font-medium underline">
          Back to sign in
        </Link>
      }
    >
      {state === 'valid' ? (
        <SecureAccountConfirm token={token as string} />
      ) : state === 'already_secured' ? (
        <div className="space-y-4">
          <p
            role="status"
            className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
          >
            Your account is already locked and every device has been signed out.
            Use the reset link in your email to set a new password and sign back
            in.
          </p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Reset your password</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p
            role="alert"
            className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400"
          >
            This security link is invalid, already used, or has expired.
          </p>
          <p className="text-muted-foreground text-sm">
            If you&rsquo;re still worried about your account, reset your
            password now — it signs out every device and locks out anyone who
            knew your old password.
          </p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Reset your password</Link>
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Still need help? Contact support.
          </p>
        </div>
      )}
    </AuthCard>
  )
}
