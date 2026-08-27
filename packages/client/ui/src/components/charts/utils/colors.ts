import { readCssColor } from './css'

export type ChartVariant =
  | 'primary'
  | 'success'
  | 'info'
  | 'warning'
  | 'destructive'
  | 'neutral'

const VARIANT_VAR: Record<ChartVariant, string> = {
  primary: '--chart-ds-violet-bold',
  success: '--chart-ds-success-bold',
  info: '--chart-ds-info-bold',
  warning: '--chart-ds-warning-bold',
  destructive: '--chart-ds-destructive-bold',
  neutral: '--chart-ds-neutral',
}

const VARIANT_FALLBACK: Record<ChartVariant, string> = {
  primary: 'rgb(124, 58, 237)',
  success: 'rgb(21, 128, 61)',
  info: 'rgb(29, 78, 216)',
  warning: 'rgb(253, 186, 116)',
  destructive: 'rgb(185, 28, 28)',
  neutral: 'rgb(115, 115, 115)',
}

const CATEGORICAL_VAR = [
  '--chart-ds-categorical-1',
  '--chart-ds-categorical-2',
  '--chart-ds-categorical-3',
  '--chart-ds-categorical-4',
  '--chart-ds-categorical-5',
  '--chart-ds-categorical-6',
  '--chart-ds-categorical-7',
  '--chart-ds-categorical-8',
]

const CATEGORICAL_FALLBACK = [
  'rgb(37, 99, 235)',
  'rgb(132, 204, 22)',
  'rgb(139, 92, 246)',
  'rgb(249, 115, 22)',
  'rgb(30, 64, 175)',
  'rgb(109, 40, 217)',
  'rgb(20, 184, 166)',
  'rgb(194, 65, 12)',
]

export function lighten(color: string, amount = 0.25): string {
  const m = color.match(/(\d+\.?\d*)/g)
  if (color.startsWith('rgb') && m && m.length >= 3) {
    const [r, g, b] = m.map(Number)
    const mix = (c: number) => Math.round(c + (255 - c) * amount)
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
  }
  return `color-mix(in srgb, ${color} ${(1 - amount) * 100}%, white)`
}

/** Turn an `rgb()/rgba()` color into an `rgba()` with the given alpha. */
export function withAlpha(color: string, alpha: number): string {
  const m = color.match(/[\d.]+/g)
  if (color.startsWith('rgb') && m && m.length >= 3) {
    const [r, g, b] = m
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `color-mix(in srgb, ${color} ${alpha * 100}%, transparent)`
}

export function resolveVariant(variant: ChartVariant = 'primary'): string {
  return readCssColor(VARIANT_VAR[variant], VARIANT_FALLBACK[variant])
}

const VARIANT_NAMES: ChartVariant[] = [
  'primary',
  'success',
  'info',
  'warning',
  'destructive',
  'neutral',
]

/**
 * Resolve a value that may be a token variant name (e.g. `'success'`) or a raw
 * CSS color string. Returns `undefined` when no value is given.
 */
export function resolveVariantOrColor(value?: string): string | undefined {
  if (!value) return undefined
  return VARIANT_NAMES.includes(value as ChartVariant)
    ? resolveVariant(value as ChartVariant)
    : value
}

export function resolveCategoricalPalette(): string[] {
  return CATEGORICAL_VAR.map((item, index) =>
    readCssColor(item, CATEGORICAL_FALLBACK[index])
  )
}
