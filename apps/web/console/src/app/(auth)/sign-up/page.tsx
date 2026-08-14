import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { SignUpForm } from '@/features/auth/components/SignUpForm'

export const metadata: Metadata = { title: 'Create account' }

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create account"
      description="Start by creating your account."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="text-foreground font-medium underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  )
}
