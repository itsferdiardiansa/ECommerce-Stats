import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { ChallengeForm } from '@/features/auth/components/ChallengeForm'
import { isStepUpChallengeValid } from '@/features/auth/api/auth.server'

export const metadata: Metadata = {
  title: 'Two-factor verification',
  referrer: 'no-referrer',
}

export default async function ChallengePage({
  searchParams,
}: {
  searchParams: Promise<{
    challengeId?: string
    methods?: string
    email?: string
    next?: string
  }>
}) {
  const { challengeId, methods, email, next } = await searchParams

  if (!challengeId) {
    redirect('/sign-in')
  }

  const valid = await isStepUpChallengeValid(challengeId)
  const methodList = (methods ?? '').split(',').filter(Boolean)

  return (
    <AuthCard
      title="Two-factor verification"
      description={
        valid
          ? "Confirm it's you to finish signing in."
          : 'This sign-in session has expired.'
      }
      footer={
        <Link href="/sign-in" className="text-foreground font-medium underline">
          Back to sign in
        </Link>
      }
    >
      {valid ? (
        <ChallengeForm
          challengeId={challengeId}
          methods={methodList}
          email={email ?? ''}
          next={next}
        />
      ) : (
        <p
          role="alert"
          className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400"
        >
          This verification session has expired or is invalid. Please sign in
          again to get a new one.
        </p>
      )}
    </AuthCard>
  )
}
