'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormField,
  Input,
  toast,
  useDismissGuard,
} from '@rufieltics/ui'
import { useAuth } from '@/features/auth/context'
import { staffApi } from '@/features/staff/api'
import {
  inviteStaffSchema,
  type InviteStaffValues,
} from '@/features/staff/schemas'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'

export function InviteStaffDialog({ onInvited }: { onInvited: () => void }) {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const nextSignal = useAbortSignal()
  const { guard, dismissProps, hideClose } = useDismissGuard(loading)
  const form = useForm<InviteStaffValues>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { email: '' },
  })

  const handleInvite = async (values: InviteStaffValues) => {
    if (!token) return
    setLoading(true)
    try {
      const name = values.email.split('@')[0] || values.email
      await staffApi.invite(
        token,
        { email: values.email, name, roleKeys: [] },
        nextSignal()
      )
      toast.success(`Invitation sent to ${values.email}`)
      form.reset()
      setOpen(false)
      onInvited()
    } catch (err) {
      if (isSilentError(err)) return
      const message = err instanceof Error ? err.message : 'Invite failed'
      toast.error(message)
      form.setError('email', { message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={guard(setOpen)}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Invite staff
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        hideClose={hideClose}
        {...dismissProps}
      >
        <DialogHeader>
          <DialogTitle>Invite a staff member</DialogTitle>
          <DialogDescription>
            They receive an email to set a password and enrol MFA. Assign roles
            afterwards from Set roles.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(handleInvite)}
            className="space-y-4"
          >
            <FormField name="email" label="Email" disabled={loading}>
              <Input type="text" inputMode="email" autoFocus />
            </FormField>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" loading={loading}>
                Invite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
