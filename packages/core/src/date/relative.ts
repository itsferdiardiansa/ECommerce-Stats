import { formatDate, type DateFormatOptions, type DateInput } from './format'

function toDate(input: DateInput): Date | null {
  const date = input instanceof Date ? input : new Date(input)
  return Number.isNaN(date.getTime()) ? null : date
}

const plural = (value: number, unit: string) =>
  `${value} ${unit}${value > 1 ? 's' : ''}`

export function formatRelative(
  input: DateInput,
  options: DateFormatOptions = {}
): string {
  const date = toDate(input)
  if (!date) return ''

  const diffMs = Date.now() - date.getTime()
  const future = diffMs < 0
  const seconds = Math.round(Math.abs(diffMs) / 1000)
  const phrase = (value: number, unit: string) =>
    future ? `in ${plural(value, unit)}` : `${plural(value, unit)} ago`

  if (seconds < 45) return future ? 'in a moment' : 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return phrase(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return phrase(hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 7) return phrase(days, 'day')

  return formatDate(date, 'short', options)
}
