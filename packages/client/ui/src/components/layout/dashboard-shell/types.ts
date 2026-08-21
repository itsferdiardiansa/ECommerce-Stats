import type * as React from 'react'

export interface DashboardNavItem {
  title: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  active?: boolean
  /** Visible but not yet available: dimmed, non-clickable, "Soon" tag. */
  disabled?: boolean
  /** Sub-items render as a collapsible submenu under this entry. */
  items?: DashboardNavItem[]
  /** Force the submenu open on mount (otherwise it opens when a child is active). */
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

/** When set, the sidebar drills into a dedicated section with a back header. */
export interface DashboardSection {
  title: string
  /** Where the back affordance returns to (usually the console home). */
  backHref: string
}

export interface DashboardShellProps {
  appName: string
  /** Single flat menu. Ignored when `navGroups` is provided. */
  nav?: DashboardNavItem[]
  /** Multiple labelled sections. Takes precedence over `nav`. */
  navGroups?: DashboardNavGroup[]
  navLabel?: string
  /** Where the brand in the sidebar header links to. Defaults to '/'. */
  homeHref?: string
  /** Drill-in section: swaps the brand header for a back header. */
  section?: DashboardSection
  user?: DashboardUser
  headerActions?: React.ReactNode
  onSignOut?: () => void
  /** Render the sidebar nav + profile as skeletons (menu still being fetched). */
  loading?: boolean
  children: React.ReactNode
}
