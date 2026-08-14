'use client'

import { Bell } from 'lucide-react'
import { Card, CardContent } from '@rufieltics/ui'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Platform alerts and audit activity.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Bell className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">No notifications yet.</p>
        </CardContent>
      </Card>
    </div>
  )
}
