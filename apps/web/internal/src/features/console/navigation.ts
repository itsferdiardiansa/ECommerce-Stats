import {
  ArrowLeftRight,
  Bell,
  BarChart3,
  Blocks,
  Building2,
  CreditCard,
  FileBarChart,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Lock,
  MailCheck,
  Plug,
  ReceiptText,
  Scale,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  TriangleAlert,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  Webhook,
  type LucideIcon,
} from 'lucide-react'

export interface NavConfigItem {
  title: string
  href?: string
  icon?: LucideIcon
  /** Visible only when the staff member holds this permission. */
  permission?: string
  /** Visible when the staff member holds ANY of these (use instead of `permission`). */
  anyPermission?: string[]
  /** Feature not built yet: shown (if permitted) but dimmed + non-clickable. */
  disabled?: boolean
  items?: NavConfigItem[]
}

export interface NavConfigGroup {
  label?: string
  items: NavConfigItem[]
}

export interface NavSectionConfig {
  /** Route prefix that activates this section's dedicated sidebar. */
  prefix: string
  title: string
  backHref: string
  groups: NavConfigGroup[]
}

/**
 * The main console menu. Payments & billing collapses to a single entry that
 * drills into its own dedicated sidebar (see PAYMENTS_BILLING_SECTION).
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
        title: 'Payments & billing',
        href: '/billing',
        icon: Wallet,
        anyPermission: ['payments.manage', 'billing.view', 'plans.view'],
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

/** Dedicated Payments & Billing section — activates on any /billing route. */
export const PAYMENTS_BILLING_SECTION: NavSectionConfig = {
  prefix: '/billing',
  title: 'Payments & Billing',
  backHref: '/',
  groups: [
    {
      label: 'Payments',
      items: [
        {
          title: 'Overview',
          href: '/billing',
          icon: LayoutDashboard,
          permission: 'billing.view',
        },
        {
          title: 'Needs attention',
          href: '/billing/attention',
          icon: TriangleAlert,
          permission: 'billing.view',
        },
        {
          title: 'Transactions',
          icon: ArrowLeftRight,
          permission: 'payments.manage',
          items: [
            { title: 'All charges', href: '/billing/transactions' },
            { title: 'Refunds', href: '/billing/transactions/refunds' },
            { title: 'Failed & retries', href: '/billing/transactions/failed' },
          ],
        },
        {
          title: 'Disputes & chargebacks',
          href: '/billing/disputes',
          icon: ShieldAlert,
          permission: 'payments.manage',
        },
        {
          title: 'Payouts & settlements',
          href: '/billing/payouts',
          icon: Wallet,
          permission: 'payments.manage',
          disabled: true,
        },
        {
          title: 'Reconciliation',
          href: '/billing/reconciliation',
          icon: Scale,
          permission: 'payments.manage',
          disabled: true,
        },
      ],
    },
    {
      label: 'Billing',
      items: [
        {
          title: 'Plans & pricing',
          icon: CreditCard,
          permission: 'plans.view',
          items: [
            { title: 'Plans', href: '/billing/plans', disabled: true },
            {
              title: 'Prices & currencies',
              href: '/billing/prices',
              disabled: true,
            },
            {
              title: 'Coupons & discounts',
              href: '/billing/coupons',
              disabled: true,
            },
          ],
        },
        {
          title: 'Subscriptions',
          icon: ReceiptText,
          permission: 'billing.view',
          items: [
            { title: 'Active', href: '/billing/subscriptions', disabled: true },
            { title: 'Upcoming renewals', href: '/billing/renewals' },
            {
              title: 'Trials',
              href: '/billing/subscriptions/trials',
              disabled: true,
            },
            {
              title: 'Past due · dunning',
              href: '/billing/subscriptions/past-due',
              disabled: true,
            },
            {
              title: 'Canceled',
              href: '/billing/subscriptions/canceled',
              disabled: true,
            },
          ],
        },
        {
          title: 'Invoices',
          href: '/billing/invoices',
          icon: FileBarChart,
          permission: 'billing.view',
          disabled: true,
        },
        {
          title: 'Billing accounts',
          href: '/billing/accounts',
          icon: Building2,
          permission: 'billing.view',
          disabled: true,
        },
        {
          title: 'Tax · PPN & e-Faktur',
          href: '/billing/tax',
          icon: Scale,
          permission: 'billing.view',
          disabled: true,
        },
      ],
    },
    {
      label: 'Configuration',
      items: [
        {
          title: 'Payment providers',
          href: '/billing/providers',
          icon: Plug,
          permission: 'payments.manage',
        },
        {
          title: 'Methods & routing',
          href: '/billing/routing',
          icon: SlidersHorizontal,
          permission: 'payments.manage',
          disabled: true,
        },
        {
          title: 'Webhooks & events',
          href: '/billing/webhooks',
          icon: Webhook,
          permission: 'payments.manage',
          disabled: true,
        },
        {
          title: 'Entitlements & limits',
          href: '/billing/entitlements',
          icon: LayoutGrid,
          permission: 'payments.manage',
          disabled: true,
        },
        {
          title: 'Features',
          href: '/billing/features',
          icon: Tags,
          permission: 'payments.manage',
          disabled: true,
        },
        {
          title: 'Billing settings',
          href: '/billing/settings',
          icon: Settings,
          permission: 'settings.manage',
          disabled: true,
        },
      ],
    },
  ],
}

export const CONSOLE_SECTIONS: NavSectionConfig[] = [PAYMENTS_BILLING_SECTION]
