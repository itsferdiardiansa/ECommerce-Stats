'use client'

import { useAccountSettings } from './useAccountQueries'

export function useFormatters() {
  const { data } = useAccountSettings()
  const timeZone = data?.defaultTimezone || 'UTC'
  const dateFormat = data?.dateFormat || 'MM/DD/YYYY'

  const toDate = (value: string | Date) =>
    typeof value === 'string' ? new Date(value) : value

  const parts = (d: Date) => {
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d)
    const get = (t: string) => p.find(x => x.type === t)?.value ?? ''
    return { y: get('year'), m: get('month'), d: get('day') }
  }

  const formatDate = (value: string | Date) => {
    const d = toDate(value)
    if (Number.isNaN(d.getTime())) return ''
    const { y, m, d: day } = parts(d)
    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${m}/${y}`
      case 'YYYY-MM-DD':
        return `${y}-${m}-${day}`
      default:
        return `${m}/${day}/${y}`
    }
  }

  const formatTime = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)

  const formatDateTime = (value: string | Date) => {
    const d = toDate(value)
    if (Number.isNaN(d.getTime())) return ''
    return `${formatDate(d)} ${formatTime(d)}`
  }

  return { formatDate, formatDateTime, timeZone, dateFormat }
}
