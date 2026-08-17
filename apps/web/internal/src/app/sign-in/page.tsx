'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignInForm } from '@/features/auth/components/SignInForm'
import { useAuth } from '@/features/auth/context'

export default function SignInPage() {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignInForm />
    </div>
  )
}
