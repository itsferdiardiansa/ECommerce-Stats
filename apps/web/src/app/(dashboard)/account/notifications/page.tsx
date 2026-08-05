import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Choose which security emails and account alerts you receive.',
}

export default function NotificationsPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <p className="text-muted-foreground text-sm">
        Choose which security emails you receive.
      </p>
    </div>
  )
}
