export interface BackTarget {
  href: string
  label: string
}

const BACK: Record<string, BackTarget> = {
  overview: { href: '/billing', label: 'Back to overview' },
  attention: { href: '/billing/attention', label: 'Back to needs attention' },
  disputes: { href: '/billing/disputes', label: 'Back to disputes' },
  renewals: { href: '/billing/renewals', label: 'Back to renewals' },
  transactions: {
    href: '/billing/transactions',
    label: 'Back to transactions',
  },
  refunds: { href: '/billing/transactions/refunds', label: 'Back to refunds' },
  failed: {
    href: '/billing/transactions/failed',
    label: 'Back to failed charges',
  },
}

export function resolveBackTarget(from?: string): BackTarget {
  return (from && BACK[from]) || BACK.transactions
}
