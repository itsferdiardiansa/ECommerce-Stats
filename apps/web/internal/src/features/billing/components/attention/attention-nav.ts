import { slugify } from '@rufieltics/core'
import type {
  AttentionAccount,
  AttentionKey,
} from '@/features/billing/data/attention'

export function attentionCategoryHref(key: AttentionKey): string {
  if (key === 'failed') return '/billing/transactions/failed'
  if (key === 'disputes') return '/billing/disputes'
  return `/billing/attention/${key}`
}

export function attentionRecordHref(
  key: AttentionKey,
  account: AttentionAccount
): string {
  if (key === 'disputes') return `/billing/disputes/${account.id}`
  if (key === 'failed') return '/billing/transactions/failed'
  return `/billing/customers/${slugify(account.org)}?from=attention`
}
