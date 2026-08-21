'use client'

import { useState } from 'react'
import { MoreHorizontal, RotateCw, X } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@rufieltics/ui'
import { useMutation } from '@rufieltics/core-client'
import { staffApi, type InvitationRow } from '@/features/staff/api'

export function InvitationRowActions({
  row,
  token,
  onChanged,
}: {
  row: InvitationRow
  token: string | null
  onChanged: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const resendMutation = useMutation({
    mutationFn: () => staffApi.resendInvitation(token!, row.id),
  })
  const cancelMutation = useMutation({
    mutationFn: () => staffApi.cancelInvitation(token!, row.id),
  })

  const canResend = row.status !== 'ACCEPTED'
  const canCancel = row.status === 'PENDING' || row.status === 'EXPIRED'

  const resend = async () => {
    try {
      await resendMutation.mutateAsync()
      toast.success(`Invitation resent to ${row.email}`)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend')
    }
  }

  const cancel = async () => {
    try {
      await cancelMutation.mutateAsync()
      toast.success(`Invitation to ${row.email} cancelled`)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel')
      throw err
    }
  }

  if (!canResend && !canCancel) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Invitation actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canResend ? (
            <DropdownMenuItem onSelect={() => void resend()}>
              <RotateCw className="size-4" />
              Resend invitation
            </DropdownMenuItem>
          ) : null}
          {canResend && canCancel ? <DropdownMenuSeparator /> : null}
          {canCancel ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={event => {
                event.preventDefault()
                setConfirmOpen(true)
              }}
            >
              <X className="size-4" />
              Cancel invitation
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive
        title="Cancel invitation?"
        description={
          <>
            Revokes the pending invitation for{' '}
            <span className="font-medium">{row.email}</span>. It will be marked
            rejected and they won&apos;t be able to finish setup.
          </>
        }
        confirmLabel="Cancel invitation"
        cancelLabel="Keep invitation"
        onConfirm={cancel}
      />
    </>
  )
}
