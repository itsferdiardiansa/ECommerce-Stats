import type {
  DashboardNavGroup,
  DashboardNavItem,
  DashboardSection,
} from '@rufieltics/ui'
import {
  CONSOLE_NAV,
  CONSOLE_SECTIONS,
  type NavConfigGroup,
  type NavConfigItem,
} from '@/features/console/navigation'

type Has = (permission: string) => boolean

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function collectHrefs(items: NavConfigItem[], out: string[]) {
  for (const item of items) {
    if (item.href) out.push(item.href)
    if (item.items) collectHrefs(item.items, out)
  }
}

function bestHref(groups: NavConfigGroup[], pathname: string): string | null {
  const hrefs: string[] = []
  for (const group of groups) collectHrefs(group.items, hrefs)
  let best: string | null = null
  for (const href of hrefs) {
    if (matches(pathname, href) && (!best || href.length > best.length)) {
      best = href
    }
  }
  return best
}

function isVisible(item: NavConfigItem, has: Has) {
  if (item.anyPermission) return item.anyPermission.some(has)
  if (item.permission) return has(item.permission)
  return true
}

function resolveItem(
  item: NavConfigItem,
  activeHref: string | null,
  has: Has
): DashboardNavItem | null {
  if (!isVisible(item, has)) return null

  const children = item.items
    ?.map(child => resolveItem(child, activeHref, has))
    .filter((child): child is DashboardNavItem => child !== null)

  if (item.items && (!children || children.length === 0)) return null

  return {
    title: item.title,
    href: item.href,
    icon: item.icon,
    disabled: item.disabled,
    active: activeHref !== null && item.href === activeHref,
    items: children,
  }
}

function resolveGroups(
  groups: NavConfigGroup[],
  pathname: string,
  has: Has
): DashboardNavGroup[] {
  const activeHref = bestHref(groups, pathname)
  return groups
    .map(group => ({
      label: group.label,
      items: group.items
        .map(item => resolveItem(item, activeHref, has))
        .filter((item): item is DashboardNavItem => item !== null),
    }))
    .filter(group => group.items.length > 0)
}

export function resolveNavGroups(
  pathname: string,
  has: Has
): DashboardNavGroup[] {
  return resolveGroups(CONSOLE_NAV, pathname, has)
}

export interface ResolvedNav {
  section?: DashboardSection
  groups: DashboardNavGroup[]
}

/**
 * Resolves the sidebar for the current route: the dedicated section nav when
 * inside a section's route prefix, otherwise the main console nav. The nav is
 * always filtered by permission and marked active.
 */
export function resolveConsoleNav(pathname: string, has: Has): ResolvedNav {
  const active = CONSOLE_SECTIONS.find(
    s => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`)
  )
  if (active) {
    return {
      section: { title: active.title, backHref: active.backHref },
      groups: resolveGroups(active.groups, pathname, has),
    }
  }
  return { groups: resolveNavGroups(pathname, has) }
}
