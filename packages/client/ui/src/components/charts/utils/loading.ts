export type ChartSpinnerVariant = 'spinner' | 'dots' | 'bars' | 'pulse'

export type ChartLoadingSize = 'sm' | 'md' | 'lg'

/**
 * A color that may differ per theme. Pass a single string to use it in both
 * themes, or `{ light, dark }` to vary it. If only one side is given, that one
 * is used for both; if neither is given, the design-token default applies.
 */
export type ChartThemedColor = string | { light?: string; dark?: string }

export type ChartTheme = 'light' | 'dark'

/** Picks the value for `theme`, falling back to the other side, then `fallback`. */
export function resolveThemedColor(
  value: ChartThemedColor | undefined,
  theme: ChartTheme,
  fallback: string
): string {
  if (!value) return fallback
  if (typeof value === 'string') return value
  return value[theme] ?? value.light ?? value.dark ?? fallback
}

export interface ChartLoadingProps {
  loading?: boolean
  loadingVariant?: ChartSpinnerVariant
  loadingSize?: ChartLoadingSize
  loadingColor?: ChartThemedColor
  loadingMask?: ChartThemedColor
}
