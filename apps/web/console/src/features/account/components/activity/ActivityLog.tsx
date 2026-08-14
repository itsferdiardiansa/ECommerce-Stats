'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'
import type { ActivityEntry } from '@/features/account/api/account.api'
import { useActivity } from '../../hooks/useAccountQueries'
import { ActivityRow } from './ActivityRow'
import { ActivityDetailDialog } from './ActivityDetailDialog'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

export function ActivityLog() {
  const { data, isLoading, error } = useActivity()
  const [selected, setSelected] = useState<ActivityEntry | null>(null)

  if (isLoading || data === undefined) {
    return error ? (
      <FormError message={errText(error, 'Could not load your activity.')} />
    ) : (
      <Loading />
    )
  }

  if (data.items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No recent activity yet.</p>
    )
  }

  const rest = data.total - data.items.length

  return (
    <>
      <Card className="py-0">
        <CardContent className="divide-border divide-y p-0">
          {data.items.map(e => (
            <ActivityRow key={e.id} entry={e} onSelect={setSelected} />
          ))}
          {rest > 0 ? (
            <Link
              href="/account/activity/all"
              className="hover:bg-muted/50 flex items-center justify-between gap-3 px-6 py-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-muted-foreground size-5 shrink-0" />
                <span className="font-medium">Review security activities</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary">{rest}</Badge>
                <ChevronRight className="text-muted-foreground size-4" />
              </div>
            </Link>
          ) : null}
        </CardContent>
      </Card>

      <ActivityDetailDialog
        entry={selected}
        onOpenChange={open => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
