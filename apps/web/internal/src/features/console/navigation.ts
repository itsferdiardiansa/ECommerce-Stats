import {
  Bell,
  BarChart3,
  Blocks,
  Building2,
  CreditCard,
  FileBarChart,
  Home,
  LifeBuoy,
  Lock,
  MailCheck,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardNavGroup, DashboardNavItem } from '@rufieltics/ui'

interface NavConfigItem {
  title: string
  href?: string
  icon?: LucideIcon
  permission?: string
  /** Feature not built yet: shown (if permitted) but dimmed + non-clickable. */
  disabled?: boolean
  items?: NavConfigItem[]
}

interface NavConfigGroup {
  label?: string
  items: NavConfigItem[]
}

/**
 * The complete console menu. `permission` controls visibility (hidden when the
 * staff member lacks it); `disabled` marks features that aren't built yet.
 */
export const CONSOLE_NAV: NavConfigGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Home', href: '/', icon: Home }],
  },
  {
    label: 'Customers',
    items: [
      {
        title: 'Users',
        href: '/users',
        icon: UsersRound,
        permission: 'users.view',
        disabled: true,
      },
      {
        title: 'Organizations',
        href: '/organizations',
        icon: Building2,
        permission: 'organizations.view',
        disabled: true,
      },
      {
        title: 'Lockouts',
        href: '/lockouts',
        icon: Lock,
        permission: 'lockouts.manage',
        disabled: true,
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      {
        title: 'Revenue',
        href: '/revenue',
        icon: TrendingUp,
        permission: 'revenue.view',
        disabled: true,
      },
      {
        title: 'Usage',
        href: '/usage',
        icon: BarChart3,
        permission: 'analytics.view',
        disabled: true,
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: FileBarChart,
        permission: 'analytics.view',
        disabled: true,
      },
    ],
  },
  {
    label: 'Integrations',
    items: [
      {
        title: 'Integrations',
        icon: Blocks,
        permission: 'integrations.view',
        items: [
          {
            title: 'WooCommerce',
            href: '/integrations/woocommerce',
            disabled: true,
          },
          { title: 'Shopify', href: '/integrations/shopify', disabled: true },
          {
            title: 'Facebook Ads',
            href: '/integrations/facebook-ads',
            disabled: true,
          },
          {
            title: 'Google Ads',
            href: '/integrations/google-ads',
            disabled: true,
          },
          {
            title: 'Google Analytics',
            href: '/integrations/google-analytics',
            disabled: true,
          },
        ],
      },
    ],
  },
  {
    label: 'Billing',
    items: [
      {
        title: 'Plans',
        href: '/plans',
        icon: CreditCard,
        permission: 'plans.view',
        disabled: true,
      },
      {
        title: 'Subscriptions',
        href: '/subscriptions',
        icon: ReceiptText,
        permission: 'billing.view',
        disabled: true,
      },
      {
        title: 'Payments',
        href: '/payments',
        icon: Wallet,
        permission: 'payments.manage',
        disabled: true,
      },
    ],
  },
  {
    label: 'Platform',
    items: [
      { title: 'Staff', href: '/staff', icon: Users, permission: 'staff.view' },
      {
        title: 'Roles',
        href: '/roles',
        icon: ShieldCheck,
        permission: 'roles.manage',
      },
      {
        title: 'Invitations',
        href: '/invitations',
        icon: MailCheck,
        permission: 'staff.view',
      },
      {
        title: 'Audit log',
        href: '/audit',
        icon: ScrollText,
        permission: 'audit.view',
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        permission: 'settings.manage',
        disabled: true,
      },
    ],
  },
  {
    label: 'Support',
    items: [
      {
        title: 'Support inbox',
        href: '/support',
        icon: LifeBuoy,
        permission: 'support.view',
        disabled: true,
      },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
        permission: 'notifications.manage',
      },
    ],
  },
]

type Has = (permission: string) => boolean

function isActive(pathname: string, href?: string) {
  if (!href) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function resolveItem(
  item: NavConfigItem,
  pathname: string,
  has: Has
): DashboardNavItem | null {
  if (item.permission && !has(item.permission)) return null

  const children = item.items
    ?.map(child => resolveItem(child, pathname, has))
    .filter((child): child is DashboardNavItem => child !== null)

  if (item.items && (!children || children.length === 0)) return null

  return {
    title: item.title,
    href: item.href,
    icon: item.icon,
    disabled: item.disabled,
    active: isActive(pathname, item.href),
    items: children,
  }
}

export function resolveNavGroups(
  pathname: string,
  has: Has
): DashboardNavGroup[] {
  return CONSOLE_NAV.map(group => ({
    label: group.label,
    items: group.items
      .map(item => resolveItem(item, pathname, has))
      .filter((item): item is DashboardNavItem => item !== null),
  })).filter(group => group.items.length > 0)
}
