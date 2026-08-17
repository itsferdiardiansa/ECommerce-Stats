'use client'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
  useDismissGuard,
} from '@rufieltics/ui'
import { staffApi, type RoleRow } from '@/features/staff/api'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'

interface DeleteRoleDialogProps {
  role: RoleRow | null
  token: string | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteRoleDialog({
  role,
  token,
  onOpenChange,
  onDeleted,
}: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false)
  const nextSignal = useAbortSignal()
  const { guard, dismissProps, hideClose } = useDismissGuard(loading)

  const confirm = async () => {
    if (!token || !role) return
    setLoading(true)
    try {
      await staffApi.deleteRole(token, role.key, nextSignal())
      toast.success(`${role.name} deleted`)
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      if (isSilentError(err)) return
      toast.error(err instanceof Error ? err.message : 'Could not delete role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!role} onOpenChange={guard(onOpenChange)}>
      <DialogContent
        className="sm:max-w-md"
        hideClose={hideClose}
        {...dismissProps}
      >
        <DialogHeader>
          <DialogTitle>Delete {role?.name}?</DialogTitle>
          <DialogDescription>
            {role && role.memberCount > 0
              ? `This role is used by ${role.memberCount} staff member${
                  role.memberCount === 1 ? '' : 's'
                }. They will lose the permissions it grants.`
              : 'This role will be permanently removed.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={loading}
            onClick={confirm}
          >
            Delete role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
