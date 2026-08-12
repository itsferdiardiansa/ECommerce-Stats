'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function SecureAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Secure your account</DialogTitle>
          <DialogDescription>
            If there&apos;s recent activity you don&apos;t recognize, someone
            else may know your password. Change your password to protect your
            account.
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          You&apos;ll be signed out of all devices except the one you&apos;re
          using.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => router.push('/account/security/password')}>
            Change password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
