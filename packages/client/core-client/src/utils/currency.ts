export interface CurrencyMeta {
  /** Symbol shown before the amount (e.g. "Rp", "$"). */
  prefix: string
  /** Thousands separator used while editing. */
  group: string
  /** Decimal separator used while editing. */
  decimal: string
  decimals: number
  locale: string
}

const CURRENCY: Record<string, CurrencyMeta> = {
  IDR: { prefix: 'Rp', group: '.', decimal: ',', decimals: 0, locale: 'id-ID' },
  USD: { prefix: '$', group: ',', decimal: '.', decimals: 2, locale: 'en-US' },
  EUR: { prefix: '€', group: '.', decimal: ',', decimals: 2, locale: 'de-DE' },
}

const FALLBACK: CurrencyMeta = {
  prefix: '',
  group: ',',
  decimal: '.',
  decimals: 2,
  locale: 'en-US',
}

export function currencyMeta(code: string): CurrencyMeta {
  return CURRENCY[code] ?? FALLBACK
}

/** "Rp 299.000", "$1,299.00" */
export function formatCurrency(value: number, code: string): string {
  const meta = currencyMeta(code)
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: meta.decimals,
  }).format(value)
}

/** "Rp 48,2 jt", "$1.2K" - compact, for KPI tiles and axes. */
export function formatCurrencyCompact(value: number, code: string): string {
  const meta = currencyMeta(code)
  const compact = new Intl.NumberFormat(meta.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
  return meta.prefix ? `${meta.prefix} ${compact}` : compact
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Parses a display string ("Rp 299.000", "$1,299.00") back to a number. */
export function parseCurrency(display: string, code: string): number {
  const meta = currencyMeta(code)
  const digits = display.replace(/[^\d.,]/g, '')
  const withoutGroup = digits.replace(
    new RegExp(escapeRegExp(meta.group), 'g'),
    ''
  )
  const normalized =
    meta.decimal === '.'
      ? withoutGroup
      : withoutGroup.replace(meta.decimal, '.')
  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}
