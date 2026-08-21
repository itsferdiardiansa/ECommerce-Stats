import type { SelectFieldOption } from '@rufieltics/ui'

export const REFUND_CURRENCIES: SelectFieldOption[] = [
  { value: 'IDR', label: 'IDR · Rp' },
  { value: 'USD', label: 'USD · $' },
]

export const REFUND_REASONS: SelectFieldOption[] = [
  { value: 'requested', label: 'Customer request' },
  { value: 'duplicate', label: 'Duplicate charge' },
  { value: 'fraud', label: 'Fraudulent' },
  { value: 'proration', label: 'Downgrade proration' },
  { value: 'goodwill', label: 'Goodwill / service credit' },
  { value: 'other', label: 'Other' },
]

export const REFUND_QUICK_PERCENTS = [25, 50, 75, 100]

export const PPN_RATE = 11
