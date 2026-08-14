'use client'

import { useRouter } from 'next/navigation'
import { Globe, Monitor } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ActivityEntry } from '@/features/account/api/account.api'
import { activityTitle } from '@/features/account/lib/activity'
import { useFormatters } from '@/features/account/hooks/useFormatters'

export function ActivityDetailDialog({
  entry,
  onOpenChange,
}: {
  entry: ActivityEntry | null
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { formatDateTime } = useFormatters()

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {entry ? (
          <>
            <DialogHeader className="space-y-1">
              <p className="text-muted-foreground text-sm">
                {formatDateTime(entry.createdAt)}
              </p>
              <DialogTitle>{activityTitle(entry)}</DialogTitle>
            </DialogHeader>

            <p className="text-muted-foreground text-sm">
              Your account is at risk if this wasn&apos;t you.
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Monitor className="text-muted-foreground size-4 shrink-0" />
                {entry.os ?? 'Unknown device'}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="text-muted-foreground size-4 shrink-0" />
                {entry.country ?? entry.location ?? 'Unknown location'}
              </div>
            </div>

            <p className="font-medium">Recognize this activity?</p>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Yes, it was me
              </Button>
              <Button
                variant="destructive"
                onClick={() => router.push('/account/security/password')}
              >
                No, secure account
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
