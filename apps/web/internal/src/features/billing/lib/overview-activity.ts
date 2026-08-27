import { slugify } from '@rufieltics/core'
import type { RecentPayment } from '@/features/billing/data/overview'
import type { Renewal } from '@/features/billing/data/renewals'
import type { TxnRow } from '@/features/billing/data/transactions'

export type ActivityRange = '1d' | '3d' | '7d'

export const RANGE_DAYS: Record<ActivityRange, number> = {
  '1d': 1,
  '3d': 3,
  '7d': 7,
}

export function paymentTimeLabel(payment: RecentPayment) {
  if (payment.daysAgo === 0) return payment.when
  if (payment.daysAgo === 1) return '1d ago'
  return `${payment.daysAgo}d ago`
}

export function paymentToTxnRow(payment: RecentPayment): TxnRow {
  return {
    id: `CH-${slugify(payment.org).slice(0, 6)}-${payment.when.replace(':', '')}`,
    date:
      payment.daysAgo === 0
        ? `Today · ${payment.when}`
        : `${payment.daysAgo}d ago · ${payment.when}`,
    org: payment.org,
    email: `billing@${slugify(payment.org).replace(/-/g, '')}.id`,
    amount: payment.amount,
    currency: payment.currency as TxnRow['currency'],
    method: payment.method,
    methodColor: payment.methodColor,
    provider: payment.provider,
    status: payment.status,
    statusLabel: payment.statusLabel,
  }
}

export type RenewalTab = 'scheduled' | 'at-risk' | 'auto-renew'

export const RENEWAL_MATCH: Record<RenewalTab, (renewal: Renewal) => boolean> =
  {
    scheduled: renewal => renewal.status === 'scheduled',
    'at-risk': renewal => renewal.status === 'at_risk',
    'auto-renew': renewal => !renewal.autoRenew,
  }

export type RenewalRow =
  | { type: 'group'; label: string }
  | { type: 'renewal'; renewal: Renewal }

export function groupRenewals(
  renewals: Renewal[],
  tab: RenewalTab
): RenewalRow[] {
  const groups = new Map<string, Renewal[]>()
  for (const renewal of renewals.filter(RENEWAL_MATCH[tab])) {
    const list = groups.get(renewal.nextCharge)
    if (list) list.push(renewal)
    else groups.set(renewal.nextCharge, [renewal])
  }
  const rows: RenewalRow[] = []
  for (const [label, items] of groups) {
    rows.push({ type: 'group', label })
    for (const renewal of items) rows.push({ type: 'renewal', renewal })
  }
  return rows
}
