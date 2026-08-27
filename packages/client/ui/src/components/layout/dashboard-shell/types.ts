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

export interface DashboardSection {
  title: string
  backHref: string
}

export interface DashboardShellProps {
  appName: string
  nav?: DashboardNavItem[]
  navGroups?: DashboardNavGroup[]
  navLabel?: string
  homeHref?: string
  section?: DashboardSection
  user?: DashboardUser
  breadcrumb?: React.ReactNode
  headerActions?: React.ReactNode
  onSignOut?: () => void
  loading?: boolean
  children: React.ReactNode

  title?: string
  subTitle?: string
  actions?: React.ReactNode
  headerLead?: React.ReactNode
  headerComponent?: React.ReactNode
  alert?: React.ReactNode
}
