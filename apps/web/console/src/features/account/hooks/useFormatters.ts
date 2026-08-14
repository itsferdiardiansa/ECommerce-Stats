'use client'

import { useAccountSettings } from './useAccountQueries'

export function useFormatters() {
  const { data } = useAccountSettings()
  const timeZone = data?.defaultTimezone || 'UTC'
  const dateFormat = data?.dateFormat || 'MM/DD/YYYY'

  const toDate = (value: string | Date) =>
    typeof value === 'string' ? new Date(value) : value

  const part = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone, ...opts }).format(d)

  const formatDate = (value: string | Date) => {
    const d = toDate(value)
    if (Number.isNaN(d.getTime())) return ''
    const yyyy = part(d, { year: 'numeric' })
    const mm = part(d, { month: '2-digit' })
    const dd = part(d, { day: '2-digit' })
    const day = part(d, { day: 'numeric' })
    const mmm = part(d, { month: 'short' })
    const mmmm = part(d, { month: 'long' })
    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${dd}/${mm}/${yyyy}`
      case 'YYYY-MM-DD':
        return `${yyyy}-${mm}-${dd}`
      case 'MMM D, YYYY':
        return `${mmm} ${day}, ${yyyy}`
      case 'MMMM D, YYYY':
        return `${mmmm} ${day}, ${yyyy}`
      case 'D MMM YYYY':
        return `${day} ${mmm} ${yyyy}`
      default:
        return `${mm}/${dd}/${yyyy}`
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
