'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ResponsiveDrawer,
  Timeline,
  type TimelineStep,
} from '@rufieltics/ui'
import type { PlanEvent } from '@/features/billing/data/customers'

const LIMIT = 4

function toSteps(events: PlanEvent[]): TimelineStep[] {
  return events.map((e, i) => ({
    title: e.title,
    time: e.date,
    note: e.note,
    status: i === 0 ? 'current' : 'done',
  }))
}

export function CustomerPlanHistory({ events }: { events: PlanEvent[] }) {
  const [seeAll, setSeeAll] = useState(false)
  const visible = events.slice(0, LIMIT)
  const hidden = events.length - LIMIT

  return (
    <section className="flex flex-col gap-3">
      <div className="flex h-8 items-center justify-between">
        <h2 className="text-sm font-medium">Plan history</h2>
      </div>
      <Card className="flex-1 gap-0 overflow-hidden py-0">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex-1 px-4 py-3">
            <Timeline steps={toSteps(visible)} />
          </div>
          {hidden > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSeeAll(true)}
              className="text-muted-foreground mt-auto w-full justify-center rounded-none border-t"
            >
              See all {events.length} changes
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <ResponsiveDrawer
        open={seeAll}
        onOpenChange={setSeeAll}
        title="Plan history"
        description={`${events.length} changes`}
      >
        <Timeline steps={toSteps(events)} />
      </ResponsiveDrawer>
    </section>
  )
}
