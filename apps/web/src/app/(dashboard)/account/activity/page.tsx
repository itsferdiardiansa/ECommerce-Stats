import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activity',
  description: 'Review recent sign-ins and security events on your account.',
}

export default function ActivityPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold">Activity</h1>
      <p className="text-muted-foreground text-sm">
        Review recent sign ins and security events.
      </p>
    </div>
  )
}
