'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Badge,
  Combobox,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from '@rufieltics/ui'
import { useMutation, useQueryClient } from '@rufieltics/query'
import {
  staffApi,
  staffKeys,
  type RoleRow,
  type StaffRow,
} from '@/features/staff/api'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import { PermissionMatrix } from './PermissionMatrix'

interface StaffAccessDrawerProps {
  staff: StaffRow | null
  roles: RoleRow[]
  permissionKeys: string[]
  token: string | null
  onOpenChange: (open: boolean) => void
}

type PendingOp = 'add' | 'remove'

export function StaffAccessDrawer({
  staff,
  roles,
  permissionKeys,
  token,
  onOpenChange,
}: StaffAccessDrawerProps) {
  const queryClient = useQueryClient()
  const perm = usePermissions()
  const canManage = perm.has('roles.manage')
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [pending, setPending] = useState<Record<string, PendingOp>>({})

  useEffect(() => {
    setPending({})
  }, [staff?.id])

  const roleByKey = useMemo(() => new Map(roles.map(r => [r.key, r])), [roles])

  const mutation = useMutation({
    mutationFn: ({
      op,
      staffId,
      roleKey,
    }: {
      op: PendingOp
      staffId: string
      roleKey: string
    }) =>
      op === 'add'
        ? staffApi.assignRole(token!, staffId, roleKey)
        : staffApi.removeRole(token!, staffId, roleKey),
  })

  const run = async (op: PendingOp, roleKey: string) => {
    if (!token || !staff) return
    const staffId = staff.id
    setPending(prev => ({ ...prev, [roleKey]: op }))
    try {
      await mutation.mutateAsync({ op, staffId, roleKey })
      await queryClient.invalidateQueries({ queryKey: staffKeys.all })
      toast.success(
        `${roleByKey.get(roleKey)?.name ?? 'Role'} ${op === 'add' ? 'added' : 'removed'}`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(prev => {
        const next = { ...prev }
        delete next[roleKey]
        return next
      })
    }
  }

  // Optimistic sets: pending 'add' shows immediately (dimmed), pending 'remove'
  // stays visible (dimmed) until the server confirms.
  const baseKeys = staff?.roles ?? []
  const addKeys = Object.keys(pending).filter(k => pending[k] === 'add')
  const removeKeys = new Set(
    Object.keys(pending).filter(k => pending[k] === 'remove')
  )
  const chipKeys = [...new Set([...baseKeys, ...addKeys])]
  const finalKeys = chipKeys.filter(k => !removeKeys.has(k))

  const chips = chipKeys
    .map(k => roleByKey.get(k))
    .filter((r): r is RoleRow => !!r)

  const grantSet = new Set(perm.permissions)
  const canGrantRole = (r: RoleRow) =>
    perm.isSuperAdmin || r.permissions.every(p => grantSet.has(p))

  const available = roles
    .filter(r => !chipKeys.includes(r.key) && canGrantRole(r))
    .map(r => ({
      value: r.key,
      label: r.name,
      description: `${r.permissions.length} permissions`,
    }))

  const effective = (() => {
    if (staff?.isSuperAdmin) return permissionKeys
    const set = new Set<string>()
    for (const key of finalKeys) {
      const role = roleByKey.get(key)
      if (role) for (const perm of role.permissions) set.add(perm)
    }
    return [...set]
  })()

  return (
    <Sheet open={!!staff} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <div ref={setContainer} className="flex h-full min-h-0 flex-col">
          {staff ? (
            <>
              <SheetHeader className="border-b">
                <SheetTitle>Manage access</SheetTitle>
                <SheetDescription>
                  {staff.name ? `${staff.name} · ` : ''}
                  {staff.email}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto p-4">
                {staff.isSuperAdmin ? (
                  <Alert variant="info">
                    <ShieldCheck />
                    <AlertDescription>
                      Super-admin has full access to every permission. Roles do
                      not apply.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Roles</p>
                      <p className="text-muted-foreground text-sm">
                        Grant one or more roles. Access is the union of their
                        permissions.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {chips.length ? (
                        chips.map(role => {
                          const isPending = !!pending[role.key]
                          return (
                            <Badge
                              key={role.key}
                              variant="secondary"
                              className={isPending ? 'opacity-60' : undefined}
                              onRemove={
                                !canManage || isPending
                                  ? undefined
                                  : () => run('remove', role.key)
                              }
                              removeLabel={`Remove ${role.name}`}
                            >
                              {isPending ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : null}
                              {role.name}
                            </Badge>
                          )
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No roles assigned yet.
                        </span>
                      )}
                    </div>
                    {canManage ? (
                      <Combobox
                        container={container}
                        options={available}
                        onSelect={key => run('add', key)}
                        keepOpenOnSelect
                        placeholder="Add a role…"
                        searchPlaceholder="Search roles…"
                        emptyText="No more roles to add."
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        You don't have permission to change roles.
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Effective permissions</p>
                    <p className="text-muted-foreground text-sm">
                      The net access this member has right now.
                    </p>
                  </div>
                  <PermissionMatrix
                    permissions={permissionKeys}
                    value={effective}
                    readOnly
                    emptyText="No permissions granted yet."
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
