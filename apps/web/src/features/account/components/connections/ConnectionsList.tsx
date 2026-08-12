'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'
import GoogleIcon from '@/assets/icons/brands/google.svg'
import { useConnections } from '../../hooks/useAccountQueries'
import { useUnlinkConnection } from '../../hooks/useAccountMutations'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

type IconComponent = React.ComponentType<{ className?: string }>

const PROVIDERS: Record<string, { name: string; icon?: IconComponent }> = {
  google: { name: 'Google', icon: GoogleIcon },
}

export function ConnectionsList() {
  const { data, isLoading, error } = useConnections()
  const unlink = useUnlinkConnection()
  const [removing, setRemoving] = useState<string | null>(null)

  function confirmUnlink(provider: string) {
    unlink.mutate(provider, {
      onSuccess: () => {
        toast.success('Account disconnected.')
        setRemoving(null)
      },
      onError: e =>
        toast.error(
          errText(e, 'Could not disconnect that account.') ?? 'Error'
        ),
    })
  }

  if (isLoading || data === undefined) {
    return error ? (
      <FormError message={errText(error, 'Could not load your connections.')} />
    ) : (
      <Loading />
    )
  }

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        You have no connected accounts.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="py-0">
        <CardContent className="divide-border divide-y p-0">
          {data.map(c => {
            const meta = PROVIDERS[c.provider] ?? { name: c.provider }
            const Icon = meta.icon
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  {Icon ? (
                    <Icon className="size-5" />
                  ) : (
                    <Link2 className="text-muted-foreground size-5" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{meta.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Connected - you can sign in with this account.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRemoving(c.provider)}
                >
                  Disconnect
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog
        open={removing !== null}
        onOpenChange={next => {
          if (!unlink.isPending && !next) setRemoving(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disconnect account?</DialogTitle>
            <DialogDescription>
              You can reconnect it anytime by signing in with it again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRemoving(null)}
              disabled={unlink.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={unlink.isPending}
              onClick={() => removing && confirmUnlink(removing)}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
