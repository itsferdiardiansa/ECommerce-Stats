'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dialog'

export interface ConfirmDialogProps {
  /** Uncontrolled: renders a trigger that opens the dialog. */
  trigger?: React.ReactNode
  /** Controlled open state (omit `trigger` when driving it externally). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [openState, setOpenState] = React.useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : openState
  const setOpen = (next: boolean) => {
    if (!isControlled) setOpenState(next)
    onOpenChange?.(next)
  }
  const [pending, setPending] = React.useState(false)

  const handleConfirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      /* keep the dialog open so the user can retry */
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!pending) setOpen(next)
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
