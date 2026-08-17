'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Form,
  FormField,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
  toast,
  useDismissGuard,
} from '@rufieltics/ui'
import { staffApi, type RoleRow } from '@/features/staff/api'
import { roleFormSchema, type RoleFormValues } from '@/features/staff/schemas'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import { PermissionMatrix } from './PermissionMatrix'

interface RoleFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleRow | null
  permissionKeys: string[]
  token: string | null
  onSaved: (roleKey: string) => void
}

export function RoleFormSheet({
  open,
  onOpenChange,
  role,
  permissionKeys,
  token,
  onSaved,
}: RoleFormSheetProps) {
  const isEdit = !!role
  const [loading, setLoading] = useState(false)
  const [perms, setPerms] = useState<string[]>([])
  const nextSignal = useAbortSignal()
  const { isSuperAdmin, permissions } = usePermissions()
  const { guard, dismissProps, hideClose } = useDismissGuard(loading)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { key: '', name: '', description: '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      key: role?.key ?? '',
      name: role?.name ?? '',
      description: role?.description ?? '',
    })
    setPerms(role?.permissions ?? [])
  }, [open, role, form])

  const submit = async (values: RoleFormValues) => {
    if (!token) return
    setLoading(true)
    try {
      if (isEdit && role) {
        await staffApi.updateRole(
          token,
          role.key,
          {
            name: values.name,
            description: values.description,
            permissionKeys: perms,
          },
          nextSignal()
        )
        toast.success('Role updated')
        onSaved(role.key)
      } else {
        await staffApi.createRole(
          token,
          {
            key: values.key,
            name: values.name,
            description: values.description,
            permissionKeys: perms,
          },
          nextSignal()
        )
        toast.success('Role created')
        onSaved(values.key)
      }
      onOpenChange(false)
    } catch (err) {
      if (isSilentError(err)) return
      toast.error(err instanceof Error ? err.message : 'Could not save role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={guard(onOpenChange)}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-lg"
        hideClose={hideClose}
        {...dismissProps}
      >
        <SheetHeader className="border-b">
          <SheetTitle>{isEdit ? 'Edit role' : 'New role'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the role and the permissions it grants.'
              : 'Define a role and the permissions it grants.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <fieldset
              disabled={loading}
              className="m-0 min-w-0 flex-1 space-y-4 overflow-y-auto border-0 p-4"
            >
              {!isEdit ? (
                <FormField
                  name="key"
                  label="Key"
                  description="Immutable identifier, e.g. content_mod."
                >
                  <Input autoFocus placeholder="content_mod" />
                </FormField>
              ) : null}
              <FormField name="name" label="Name">
                <Input placeholder="Content moderator" />
              </FormField>
              <FormField name="description" label="Description">
                <Textarea rows={2} placeholder="What is this role for?" />
              </FormField>
              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions</p>
                <PermissionMatrix
                  permissions={permissionKeys}
                  value={perms}
                  onChange={setPerms}
                  grantableKeys={isSuperAdmin ? undefined : permissions}
                />
              </div>
            </fieldset>
            <SheetFooter className="flex-row justify-end gap-2 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {isEdit ? 'Save changes' : 'Create role'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
