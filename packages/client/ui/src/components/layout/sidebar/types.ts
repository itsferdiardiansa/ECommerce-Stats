import type * as React from 'react'

export interface DashboardNavItem {
  title: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  active?: boolean
  disabled?: boolean
  items?: DashboardNavItem[]
  defaultOpen?: boolean
}

export interface DashboardNavGroup {
  label?: string
  items: DashboardNavItem[]
}

export interface DashboardUser {
  name?: string | null
  email?: string | null
}
