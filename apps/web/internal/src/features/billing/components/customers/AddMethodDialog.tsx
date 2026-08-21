'use client'

import { useState } from 'react'
import { Send, ShieldCheck, X } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@rufieltics/ui'

export function AddMethodDialog({
  email,
  open,
  onOpenChange,
}: {
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [message, setMessage] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request a payment method</DialogTitle>
          <DialogDescription>
            We email the customer a secure link to add their own method - card
            and wallet details are entered on their side, never by staff.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Customer email</label>
            <Input value={email} readOnly className="bg-muted/40" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Message (optional)</label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a short note included in the email…"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ShieldCheck className="size-3.5" />
            Secure setup runs on the customer side (dedicated flow coming soon).
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              <X className="size-4" />
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={() => {
              toast.success(`Setup link sent to ${email}`)
              setMessage('')
              onOpenChange(false)
            }}
          >
            <Send className="size-4" />
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
