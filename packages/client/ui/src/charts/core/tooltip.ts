import type { ChartTheme } from './useChartTheme'

/** Shared tooltip styling so every chart matches the pie's look. */
export function chartTooltip(theme: ChartTheme) {
  return {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    padding: [4, 8] as [number, number],
    textStyle: { color: theme.text, fontSize: 11 },
    extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
  }
}
