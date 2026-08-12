import type { Metadata } from 'next'
import { NotificationsForm } from '@/features/account/components/preferences/NotificationsForm'

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Choose which security emails and account alerts you receive.',
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Choose which emails and alerts you receive.
        </p>
      </div>
      <NotificationsForm />
    </div>
  )
}
