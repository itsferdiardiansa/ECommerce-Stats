'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { inputVariants } from './Input'

interface CurrencyConfig {
  prefix: string
  group: string
  decimal: string
  decimals: number
}

// Input-masking config kept local to the UI layer (currency *display*
// formatting lives in @rufieltics/core-client).
const MASK_CURRENCY: Record<string, CurrencyConfig> = {
  IDR: { prefix: 'Rp', group: '.', decimal: ',', decimals: 0 },
  USD: { prefix: '$', group: ',', decimal: '.', decimals: 2 },
  EUR: { prefix: '€', group: '.', decimal: ',', decimals: 2 },
}

export interface MaskedInputProps
  extends Omit<
      React.ComponentProps<'input'>,
      'value' | 'onChange' | 'prefix' | 'type'
    >,
    VariantProps<typeof inputVariants> {
  /** Numeric value in major units (e.g. 299000, or 49.00). Null = empty. */
  value: number | null
  onValueChange: (value: number | null) => void
  /** Drives grouping, decimals and prefix. Defaults to a plain grouped number. */
  currency?: string
  prefix?: string
  decimals?: number
  hasError?: boolean
}

function configFor(
  currency?: string,
  prefix?: string,
  decimals?: number
): CurrencyConfig {
  const base: CurrencyConfig = (currency
    ? MASK_CURRENCY[currency]
    : undefined) ?? { prefix: '', group: ',', decimal: '.', decimals: 2 }
  return {
    prefix: prefix ?? base.prefix,
    group: base.group,
    decimal: base.decimal,
    decimals: decimals ?? base.decimals,
  }
}

function groupInt(digits: string, sep: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

function format(value: number | null, cfg: CurrencyConfig): string {
  if (value === null || Number.isNaN(value)) return ''
  const fixed =
    cfg.decimals > 0 ? value.toFixed(cfg.decimals) : String(Math.round(value))
  const [int, frac] = fixed.split('.')
  const grouped = groupInt(int, cfg.group)
  return frac != null ? `${grouped}${cfg.decimal}${frac}` : grouped
}

export function MaskedInput({
  value,
  onValueChange,
  currency,
  prefix,
  decimals,
  hasError = false,
  inputSize,
  className,
  disabled,
  ...rest
}: MaskedInputProps) {
  const cfg = configFor(currency, prefix, decimals)
  const [text, setText] = React.useState(() => format(value, cfg))

  const cfgKey = `${cfg.prefix}${cfg.group}${cfg.decimal}${cfg.decimals}`
  React.useEffect(() => {
    setText(format(value, cfg))
  }, [value, cfgKey])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const decEsc = cfg.decimal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const cleaned = e.target.value.replace(
      new RegExp(`[^0-9${decEsc}]`, 'g'),
      ''
    )
    const dotIdx = cleaned.indexOf(cfg.decimal)
    const hasDec = cfg.decimals > 0 && dotIdx >= 0

    let intPart = (hasDec ? cleaned.slice(0, dotIdx) : cleaned).replace(
      /\D/g,
      ''
    )
    intPart = intPart.replace(/^0+(?=\d)/, '')
    const fracPart = hasDec
      ? cleaned
          .slice(dotIdx + 1)
          .replace(/\D/g, '')
          .slice(0, cfg.decimals)
      : ''

    const grouped = intPart ? groupInt(intPart, cfg.group) : ''
    setText(hasDec ? `${grouped}${cfg.decimal}${fracPart}` : grouped)

    if (!intPart && !fracPart) {
      onValueChange(null)
      return
    }
    onValueChange(Number(`${intPart || '0'}${fracPart ? `.${fracPart}` : ''}`))
  }

  return (
    <div className="relative">
      {cfg.prefix ? (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
          {cfg.prefix}
        </span>
      ) : null}
      <input
        {...rest}
        inputMode="decimal"
        disabled={disabled}
        aria-invalid={hasError || undefined}
        value={text}
        onChange={handleChange}
        className={cn(
          inputVariants({ inputSize }),
          cfg.prefix && 'pl-9',
          className
        )}
      />
    </div>
  )
}
