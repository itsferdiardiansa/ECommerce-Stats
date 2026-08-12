import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AllActivity } from '@/features/account/components/activity/AllActivity'

export const metadata: Metadata = {
  title: 'All activity',
  description: 'All sign-ins and security events from the last 28 days.',
}

export default function AllActivityPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/account/activity"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Back to activity
        </Link>
        <h1 className="text-xl font-semibold">Security activity</h1>
      </div>
      <AllActivity />
    </div>
  )
}
