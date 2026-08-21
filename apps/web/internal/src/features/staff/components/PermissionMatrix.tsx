'use client'

import { Checkbox, cn } from '@rufieltics/ui'
import { groupPermissions } from '@/features/staff/lib/permissions'

interface PermissionMatrixProps {
  permissions: string[]
  value: string[]
  onChange?: (next: string[]) => void
  readOnly?: boolean
  emptyText?: string
  /**
   * Permissions the current actor may grant. When set, permissions outside it
   * are disabled (you can't grant what you don't hold). Omit for no limit.
   */
  grantableKeys?: string[]
}

export function PermissionMatrix({
  permissions,
  value,
  onChange,
  readOnly,
  emptyText = 'No permissions.',
  grantableKeys,
}: PermissionMatrixProps) {
  const selected = new Set(value)
  const grantable = grantableKeys ? new Set(grantableKeys) : null
  const canGrant = (key: string) => !grantable || grantable.has(key)
  const groups = groupPermissions(
    readOnly ? permissions.filter(k => selected.has(k)) : permissions
  )

  const toggle = (key: string, checked: boolean) => {
    if (!onChange || !canGrant(key)) return
    const next = new Set(selected)
    if (checked) next.add(key)
    else next.delete(key)
    onChange([...next])
  }

  const toggleGroup = (keys: string[], checked: boolean) => {
    if (!onChange) return
    const next = new Set(selected)
    for (const key of keys) {
      if (!canGrant(key)) continue
      if (checked) next.add(key)
      else next.delete(key)
    }
    onChange([...next])
  }

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>
  }

  return (
    <div className="space-y-5">
      {groups.map(group => {
        const groupKeys = group.items.map(i => i.key)
        const allChecked = groupKeys.every(k => selected.has(k))
        const someChecked = !allChecked && groupKeys.some(k => selected.has(k))

        return (
          <div key={group.resource} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {group.label}
              </span>
              {!readOnly ? (
                <Checkbox
                  aria-label={`Toggle all ${group.label}`}
                  checked={allChecked}
                  indeterminate={someChecked}
                  onCheckedChange={checked => toggleGroup(groupKeys, checked)}
                />
              ) : null}
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {group.items.map(item => {
                const checked = selected.has(item.key)
                const locked = !readOnly && !canGrant(item.key)
                return (
                  <label
                    key={item.key}
                    title={
                      locked ? "You don't hold this permission" : undefined
                    }
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                      !readOnly &&
                        (locked
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-accent/50 cursor-pointer'),
                      checked
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    {!readOnly ? (
                      <Checkbox
                        checked={checked}
                        disabled={locked}
                        onCheckedChange={c => toggle(item.key, c)}
                      />
                    ) : null}
                    <span className="flex flex-col">
                      <span>{item.actionLabel}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {item.key}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
