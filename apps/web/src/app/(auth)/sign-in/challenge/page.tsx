import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { ChallengeForm } from '@/features/auth/components/ChallengeForm'

export const metadata: Metadata = { title: 'Two-factor verification' }

export default async function ChallengePage({
  searchParams,
}: {
  searchParams: Promise<{
    challengeId?: string
    methods?: string
    email?: string
  }>
}) {
  const { challengeId, methods, email } = await searchParams

  // The challenge only exists in the sign-in flow; a direct visit has nothing.
  if (!challengeId) {
    redirect('/sign-in')
  }

  const methodList = (methods ?? '').split(',').filter(Boolean)

  return (
    <AuthCard
      title="Two-factor verification"
      description="Confirm it's you to finish signing in."
      footer={
        <Link href="/sign-in" className="text-foreground font-medium underline">
          Back to sign in
        </Link>
      }
    >
      <ChallengeForm
        challengeId={challengeId}
        methods={methodList}
        email={email ?? ''}
      />
    </AuthCard>
  )
}
