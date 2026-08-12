'use client'

import { useState } from 'react'
import { Clock, Globe, MapPin, Monitor, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loading } from '@/components/ui/loading'
import type { SessionInfo } from '@/features/account/api/account.api'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import {
  SudoCancelledError,
  useSudo,
} from '@/features/account/context/SudoContext'
import { useSessions } from '@/features/account/hooks/useAccountQueries'
import {
  useRevokeOtherSessions,
  useRevokeSession,
} from '@/features/account/hooks/useAccountMutations'
import { FormError } from '@/features/auth/components/FormError'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

function loginTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function lastSeen(iso: string | null) {
  if (!iso) return 'unknown'
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'a few seconds ago'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function SessionsPage() {
  const sudo = useSudo()
  const { data: sessions, error: loadError, isLoading } = useSessions()
  const revoke = useRevokeSession()
  const revokeOthersMutation = useRevokeOtherSessions()
  const [actionError, setActionError] = useState<string | null>(null)
  const [pending, setPending] = useState<
    { kind: 'one'; id: string; name: string } | { kind: 'others' } | null
  >(null)

  const error =
    actionError ?? errText(loadError, 'Could not load your sessions.')

  async function run(action: () => Promise<unknown>, successMsg: string) {
    setActionError(null)
    try {
      await sudo.perform(action)
      toast.success(successMsg)
    } catch (e) {
      if (e instanceof SudoCancelledError) return
      setActionError(errText(e, 'Could not complete that action.'))
    }
  }

  function confirmPending() {
    const p = pending
    setPending(null)
    if (!p) return
    if (p.kind === 'one') {
      void run(() => revoke.mutateAsync(p.id), 'Signed out of that device.')
    } else {
      void run(
        () => revokeOthersMutation.mutateAsync(),
        'Signed out of all other devices.'
      )
    }
  }

  const current = (sessions ?? []).filter(s => s.isCurrent)
  const others = (sessions ?? []).filter(s => !s.isCurrent)
  const hasOthers = others.length > 0

  function renderSession(s: SessionInfo) {
    const DeviceIcon = s.deviceType === 'desktop' ? Monitor : Smartphone
    return (
      <Card key={s.id} className="gap-0 overflow-hidden py-0">
        <CardHeader className="bg-muted/40 flex flex-row items-center justify-between gap-3 space-y-0 border-b py-3">
          <div className="flex min-w-0 items-center gap-2">
            <DeviceIcon className="text-muted-foreground size-5 shrink-0" />
            <span className="truncate font-medium">
              {s.deviceName ?? 'Unknown device'}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground truncate text-sm">
              {s.os ?? 'Unknown OS'}
            </span>
          </div>
          {s.isCurrent ? (
            <Badge variant="secondary" className="shrink-0">
              Current session
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() =>
                setPending({
                  kind: 'one',
                  id: s.id,
                  name: s.deviceName ?? s.browser ?? 'this device',
                })
              }
            >
              Sign out
            </Button>
          )}
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1.5 py-4 text-sm">
          <div className="flex items-center gap-2">
            <Globe className="size-4 shrink-0" />
            <span className="truncate">
              Browser: {s.browser ?? 'Unknown'} · IP address:{' '}
              {s.ipAddress ?? 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            <span className="truncate">
              Login: {loginTime(s.createdAt)} · Last Seen:{' '}
              {lastSeen(s.lastUsedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span>Location: {s.location ?? 'Unknown'}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Sessions and devices</h1>
        <p className="text-muted-foreground text-sm">
          These are the devices currently signed in to your account.
        </p>
      </div>

      <FormError message={error} />

      <div className="space-y-3">
        {isLoading || sessions === undefined ? (
          <Loading />
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active sessions.</p>
        ) : (
          <>
            {current.map(renderSession)}
            {current.length > 0 && hasOthers ? (
              <div className="flex items-center gap-3 pt-2">
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Other devices
                </span>
                <span className="bg-border h-px flex-1" />
              </div>
            ) : null}
            {others.map(renderSession)}
          </>
        )}
      </div>

      {hasOthers ? (
        <Button
          variant="outline"
          onClick={() => setPending({ kind: 'others' })}
        >
          Sign out all other devices
        </Button>
      ) : null}

      <Dialog
        open={pending !== null}
        onOpenChange={open => !open && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.kind === 'others'
                ? 'Sign out all other devices?'
                : 'Sign out this device?'}
            </DialogTitle>
            <DialogDescription>
              {pending?.kind === 'others'
                ? 'Every device except the one you are using now will be signed out and need to sign in again.'
                : `${pending?.kind === 'one' ? pending.name : 'This device'} will be signed out and will need to sign in again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmPending}>
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
