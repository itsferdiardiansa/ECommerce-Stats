'use client'

import { useEffect, useMemo, useState } from 'react'
import { Lock, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import {
  AsyncBoundary,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Skeleton,
  cn,
} from '@rufieltics/ui'
import { useStaffRefData } from '@/features/staff/hooks/useStaffRefData'
import type { RoleRow } from '@/features/staff/api'
import { PermissionMatrix } from './PermissionMatrix'
import { RoleFormSheet } from './RoleFormSheet'
import { DeleteRoleDialog } from './DeleteRoleDialog'

export function RolesCatalog() {
  const { token, roles, permissions, status, error, reload } = useStaffRefData()
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoleRow | null>(null)
  const [deleting, setDeleting] = useState<RoleRow | null>(null)

  const permissionKeys = useMemo(
    () => permissions.map(p => p.key),
    [permissions]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return roles
    return roles.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
    )
  }, [roles, query])

  const selected =
    roles.find(r => r.key === selectedKey) ?? filtered[0] ?? roles[0] ?? null

  useEffect(() => {
    if (!selectedKey && roles.length) setSelectedKey(roles[0].key)
  }, [roles, selectedKey])

  const system = filtered.filter(r => r.isSystem)
  const custom = filtered.filter(r => !r.isSystem)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (role: RoleRow) => {
    setEditing(role)
    setFormOpen(true)
  }

  const renderGroup = (label: string, items: RoleRow[]) =>
    items.length ? (
      <div className="space-y-1">
        <p className="text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
        {items.map(role => (
          <button
            key={role.key}
            type="button"
            onClick={() => setSelectedKey(role.key)}
            className={cn(
              'flex w-full flex-col gap-0.5 rounded-md border px-3 py-2 text-left transition',
              selected?.key === role.key
                ? 'border-primary/40 bg-primary/5'
                : 'hover:bg-accent/50 border-transparent'
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {role.name}
              {role.isSystem ? (
                <Lock className="text-muted-foreground size-3" />
              ) : null}
            </span>
            <span className="text-muted-foreground text-xs">
              {role.permissions.length} permissions · {role.memberCount} member
              {role.memberCount === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>
    ) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Roles</h1>
          <p className="text-muted-foreground text-sm">
            Bundles of permissions you assign to staff.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New role
        </Button>
      </div>

      <AsyncBoundary
        status={status}
        error={error}
        onRetry={reload}
        errorTitle="Couldn't load roles"
        pending={
          <div className="grid gap-4 md:grid-cols-[17rem_1fr]">
            <Card className="h-fit">
              <CardContent className="space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <div className="grid items-start gap-4 md:grid-cols-[17rem_1fr]">
          <Card className="h-fit md:sticky md:top-[4.5rem] md:self-start">
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  className="pl-9"
                  placeholder="Search roles"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              {filtered.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No roles match your search.
                </p>
              ) : (
                <div className="-mr-1 space-y-3 overflow-y-auto pr-1 md:max-h-[calc(100vh-13rem)]">
                  {renderGroup('System', system)}
                  {renderGroup('Custom', custom)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {!selected ? (
                <p className="text-muted-foreground py-10 text-center text-sm">
                  Select a role to see its permissions.
                </p>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">
                          {selected.name}
                        </h2>
                        <Badge
                          variant={selected.isSystem ? 'outline' : 'secondary'}
                        >
                          {selected.isSystem ? 'System' : 'Custom'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground font-mono text-xs">
                        {selected.key}
                      </p>
                    </div>
                    {!selected.isSystem ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(selected)}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(selected)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {selected.description ? (
                    <p className="text-muted-foreground text-sm">
                      {selected.description}
                    </p>
                  ) : null}

                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Users className="size-4" />
                    {selected.memberCount} member
                    {selected.memberCount === 1 ? '' : 's'} ·{' '}
                    {selected.permissions.length} permissions
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permissions</p>
                    <PermissionMatrix
                      permissions={permissionKeys}
                      value={selected.permissions}
                      readOnly
                      emptyText="This role grants no permissions."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AsyncBoundary>

      <RoleFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editing}
        permissionKeys={permissionKeys}
        token={token}
        onSaved={key => {
          setSelectedKey(key)
          reload()
        }}
      />
      <DeleteRoleDialog
        role={deleting}
        token={token}
        onOpenChange={open => setDeleting(open ? deleting : null)}
        onDeleted={() => {
          setSelectedKey(null)
          reload()
        }}
      />
    </div>
  )
}
