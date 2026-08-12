'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loading, Spinner } from '@/components/ui/loading'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'
import type { ActivityEntry } from '@/features/account/api/account.api'
import { useInfiniteActivity } from '../hooks/useAccountQueries'
import { ActivityRow } from './ActivityRow'
import { ActivityDetailDialog } from './ActivityDetailDialog'
import { SecureAccountDialog } from './SecureAccountDialog'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

export function AllActivity() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteActivity()
  const [selected, setSelected] = useState<ActivityEntry | null>(null)
  const [secureOpen, setSecureOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = data?.pages.flatMap(p => p.items) ?? []

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Security activity and notifications in the last 28 days.{' '}
          <a href="#" className="text-foreground underline">
            Learn more
          </a>
        </p>
        <Button variant="outline" onClick={() => setSecureOpen(true)}>
          See unusual activity?
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <FormError message={errText(error, 'Could not load your activity.')} />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No activity in the last 28 days.
        </p>
      ) : (
        <Card className="py-0">
          <CardContent className="divide-border divide-y p-0">
            {items.map(e => (
              <ActivityRow key={e.id} entry={e} onSelect={setSelected} />
            ))}
          </CardContent>
        </Card>
      )}

      <div ref={sentinelRef} aria-hidden="true" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : null}

      <ActivityDetailDialog
        entry={selected}
        onOpenChange={open => {
          if (!open) setSelected(null)
        }}
      />
      <SecureAccountDialog open={secureOpen} onOpenChange={setSecureOpen} />
    </div>
  )
}
