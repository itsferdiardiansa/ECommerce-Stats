import type { Metadata } from 'next'
import { ActivityLog } from '@/features/account/components/activity/ActivityLog'

export const metadata: Metadata = {
  title: 'Activity',
  description: 'Review recent sign-ins and security events on your account.',
}

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Activity</h1>
        <p className="text-muted-foreground text-sm">
          Recent sign-ins and security events on your account.
        </p>
      </div>
      <ActivityLog />
    </div>
  )
}
