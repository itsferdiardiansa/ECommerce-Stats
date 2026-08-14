import { Suspense } from 'react'
import { ResetTotpForm } from '@/features/auth/components/ResetTotpForm'

export default function ResetTotpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}>
        <ResetTotpForm />
      </Suspense>
    </div>
  )
}
