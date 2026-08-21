import type { TimelineStep } from '@rufieltics/ui'
import type { HistoryRow } from '@/features/billing/data/customers'
import type { TxnRow, TxnVariant } from '@/features/billing/data/transactions'

function timeOf(date: string) {
  const part = date.split(', ')[1] ?? '00:00'
  return part
}

function bump(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + minutes) % (24 * 60)
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export function providerSteps(
  row: TxnRow,
  variant: TxnVariant
): TimelineStep[] {
  const t = timeOf(row.date)

  if (variant === 'refunds') {
    const partial = row.statusLabel === 'Partial'
    return [
      {
        title: 'Refund requested',
        time: t,
        status: 'done',
        note: 'Raised by staff',
      },
      { title: 'Approved', time: bump(t, 3), status: 'done' },
      { title: `Sent to ${row.provider}`, time: bump(t, 4), status: 'done' },
      {
        title: partial ? 'Partially settled' : 'Settled to customer',
        time: bump(t, 42),
        status: partial ? 'current' : 'done',
        note: row.reason,
      },
    ]
  }

  const created: TimelineStep = {
    title: 'Charge created',
    time: t,
    status: 'done',
  }

  switch (row.statusLabel) {
    case 'Paid':
      return [
        created,
        { title: 'Authorized', time: bump(t, 1), status: 'done' },
        { title: 'Captured', time: bump(t, 1), status: 'done' },
        {
          title: 'Settled',
          time: bump(t, 38),
          status: 'done',
          note: `${row.provider} payout batch`,
        },
      ]
    case 'Pending':
      return [
        created,
        {
          title: 'Awaiting authorization',
          time: bump(t, 1),
          status: 'current',
          note: `${row.method} - customer approving`,
        },
        { title: 'Capture', status: 'pending' },
        { title: 'Settlement', status: 'pending' },
      ]
    case 'Requires action':
      return [
        created,
        {
          title: '3-D Secure challenge sent',
          time: bump(t, 1),
          status: 'current',
          note: 'Waiting on cardholder verification',
        },
        { title: 'Capture', status: 'pending' },
      ]
    case 'Recovered':
      return [
        created,
        {
          title: `Attempt 1 failed`,
          time: bump(t, 1),
          status: 'failed',
          note: 'Insufficient balance',
        },
        {
          title: `Attempt ${row.attempts ?? 2} - retry`,
          time: bump(t, 240),
          status: 'done',
        },
        { title: 'Captured', time: bump(t, 241), status: 'done' },
      ]
    case 'Failed':
      return [
        created,
        {
          title: 'Authorization declined',
          time: bump(t, 1),
          status: 'failed',
          note: row.reason,
        },
        {
          title: `Retried ${(row.attempts ?? 1) - 1}×`,
          status: 'pending',
          note: 'Auto-retry scheduled',
        },
      ]
    default:
      return [created]
  }
}

export function historySteps(row: HistoryRow): TimelineStep[] {
  const t = row.time
  if (row.kind === 'Refund' || row.statusLabel === 'Refunded') {
    return [
      {
        title: 'Refund requested',
        time: t,
        status: 'done',
        note: 'Raised by staff',
      },
      { title: 'Approved', time: bump(t, 3), status: 'done' },
      { title: `Sent to ${row.provider}`, time: bump(t, 4), status: 'done' },
      { title: 'Settled to customer', time: bump(t, 40), status: 'done' },
    ]
  }
  const created: TimelineStep = {
    title: 'Charge created',
    time: t,
    status: 'done',
  }
  switch (row.statusLabel) {
    case 'Paid':
      return [
        created,
        { title: 'Authorized', time: bump(t, 1), status: 'done' },
        { title: 'Captured', time: bump(t, 1), status: 'done' },
        { title: 'Settled', time: bump(t, 38), status: 'done' },
      ]
    case 'Pending':
      return [
        created,
        {
          title: 'Awaiting authorization',
          time: bump(t, 1),
          status: 'current',
          note: `${row.method}`,
        },
        { title: 'Capture', status: 'pending' },
      ]
    case 'Failed':
      return [
        created,
        { title: 'Authorization declined', time: bump(t, 1), status: 'failed' },
        { title: 'Retry', status: 'pending', note: 'Auto-retry scheduled' },
      ]
    default:
      return [created]
  }
}
