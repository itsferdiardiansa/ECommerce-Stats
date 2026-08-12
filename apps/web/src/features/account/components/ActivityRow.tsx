'use client'

import { CheckCircle2, ChevronRight, XCircle } from 'lucide-react'
import type { ActivityEntry } from '@/features/account/api/account.api'
import { relativeTime } from '@/lib/relative-time'
import {
  activityLabel,
  activitySubtitle,
} from '@/features/account/lib/activity'

export function ActivityRow({
  entry,
  onSelect,
}: {
  entry: ActivityEntry
  onSelect: (entry: ActivityEntry) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="hover:bg-muted/50 focus-visible:ring-ring flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex min-w-0 gap-3">
        {entry.isSuccess ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
        ) : (
          <XCircle className="text-destructive mt-0.5 size-5 shrink-0" />
        )}
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{activityLabel(entry)}</p>
          <p className="text-muted-foreground truncate text-sm">
            {activitySubtitle(entry)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-muted-foreground text-sm">
          {relativeTime(entry.createdAt)}
        </span>
        <ChevronRight className="text-muted-foreground size-4" />
      </div>
    </button>
  )
}
