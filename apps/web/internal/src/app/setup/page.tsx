import { Suspense } from 'react'
import { SetupForm } from '@/features/auth/components/SetupForm'

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}>
        <SetupForm />
      </Suspense>
    </div>
  )
}
