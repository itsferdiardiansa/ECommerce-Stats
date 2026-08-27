'use client'

import { useRouter } from 'next/navigation'
import { TriangleAlert } from 'lucide-react'
import { Alert, Button } from '@rufieltics/ui'

export function OverviewActionAlert() {
  const router = useRouter()

  return (
    <Alert
      variant="destructive"
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      <span className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-wide uppercase">
        <TriangleAlert className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        9 card payments failed in the last 24 hours - $18,420 at risk across 7
        accounts. Dunning retries pause on Friday.
      </p>
      <Button
        size="sm"
        className="bg-white text-destructive shrink-0 hover:bg-white/90"
        onClick={() => router.push('/billing/transactions/failed')}
      >
        Review failures
      </Button>
    </Alert>
  )
}
