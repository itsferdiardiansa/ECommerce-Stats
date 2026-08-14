import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm'

export const metadata: Metadata = { title: 'Verify email' }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <AuthCard
      title="Verify your email"
      description="We sent a 6-digit code to your inbox."
      footer={
        <Link href="/sign-in" className="text-foreground font-medium underline">
          Back to sign in
        </Link>
      }
    >
      <VerifyEmailForm defaultEmail={email ?? ''} />
    </AuthCard>
  )
}
