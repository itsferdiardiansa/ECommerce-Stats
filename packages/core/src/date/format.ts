export type DateInput = string | number | Date

export interface DateFormatOptions {
  timeZone?: string
  locale?: string
}

export const DEFAULT_DATE_TZ = 'Asia/Jakarta'
export const DEFAULT_DATE_LOCALE = 'en-US'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const PRESETS: Record<string, string> = {
  iso: 'YYYY-MM-DD',
  short: 'MMM DD, YYYY',
  medium: 'MMM D, YYYY',
  long: 'MMMM D, YYYY',
  datetime: 'MMM DD, YYYY · HH:mm',
  time: 'HH:mm',
  monthYear: 'MMM YYYY',
}

const pad = (value: number) => String(value).padStart(2, '0')

function toDate(input: DateInput): Date | null {
  const date = input instanceof Date ? input : new Date(input)
  return Number.isNaN(date.getTime()) ? null : date
}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: string
}

function zonedParts(date: Date, timeZone: string, locale: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long',
  })
  const map: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) map[part.type] = part.value
  let hour = Number(map.hour)
  if (hour === 24) hour = 0
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: map.weekday,
  }
}

const TOKEN_RE = /YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a/g

export function formatDate(
  input: DateInput,
  pattern = 'short',
  options: DateFormatOptions = {}
): string {
  const date = toDate(input)
  if (!date) return ''

  const timeZone = options.timeZone ?? DEFAULT_DATE_TZ
  const locale = options.locale ?? DEFAULT_DATE_LOCALE
  const z = zonedParts(date, timeZone, locale)
  const template = PRESETS[pattern] ?? pattern
  const h12 = z.hour % 12 === 0 ? 12 : z.hour % 12
  const monthName = MONTHS[z.month - 1] ?? ''

  const tokens: Record<string, string> = {
    YYYY: String(z.year),
    YY: pad(z.year % 100),
    MMMM: monthName,
    MMM: monthName.slice(0, 3),
    MM: pad(z.month),
    M: String(z.month),
    DD: pad(z.day),
    D: String(z.day),
    dddd: z.weekday,
    ddd: z.weekday.slice(0, 3),
    HH: pad(z.hour),
    H: String(z.hour),
    hh: pad(h12),
    h: String(h12),
    mm: pad(z.minute),
    m: String(z.minute),
    ss: pad(z.second),
    s: String(z.second),
    A: z.hour < 12 ? 'AM' : 'PM',
    a: z.hour < 12 ? 'am' : 'pm',
  }

  return template.replace(TOKEN_RE, token => tokens[token] ?? token)
}
