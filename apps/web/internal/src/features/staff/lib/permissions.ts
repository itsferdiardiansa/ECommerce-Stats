const RESOURCE_LABELS: Record<string, string> = {
  users: 'Users',
  lockouts: 'Lockouts',
  organizations: 'Organizations',
  plans: 'Plans',
  revenue: 'Revenue',
  staff: 'Staff',
  audit: 'Audit',
}

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  manage: 'Manage',
  ban: 'Ban',
}

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export interface PermissionItem {
  key: string
  action: string
  actionLabel: string
}

export interface PermissionGroup {
  resource: string
  label: string
  items: PermissionItem[]
}

export function groupPermissions(keys: string[]): PermissionGroup[] {
  const byResource = new Map<string, PermissionItem[]>()

  for (const key of keys) {
    const [resource, action = ''] = key.split('.')
    const items = byResource.get(resource) ?? []
    items.push({
      key,
      action,
      actionLabel: ACTION_LABELS[action] ?? titleCase(action),
    })
    byResource.set(resource, items)
  }

  return [...byResource.entries()].map(([resource, items]) => ({
    resource,
    label: RESOURCE_LABELS[resource] ?? titleCase(resource),
    items,
  }))
}

export function permissionLabel(key: string): string {
  const [resource, action = ''] = key.split('.')
  const res = RESOURCE_LABELS[resource] ?? titleCase(resource)
  const act = ACTION_LABELS[action] ?? titleCase(action)
  return `${res}: ${act}`
}
