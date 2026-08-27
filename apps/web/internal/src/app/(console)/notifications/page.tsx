'use client'

import { Bell } from 'lucide-react'
import { Card, DashboardContentShell, SectionShell } from '@rufieltics/ui'

export default function NotificationsPage() {
  return (
    <DashboardContentShell
      title="Notifications"
      subTitle="Platform alerts and audit activity."
    >
      <SectionShell>
        <Card bordered={false}>
          <Card.Content className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Bell className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No notifications yet.
            </p>
          </Card.Content>
        </Card>
      </SectionShell>
    </DashboardContentShell>
  )
}
