import { withAlpha } from '@/components/charts/utils'
import type { EChartEventParams } from '@/components/charts/hooks'
import type { LineCurve, LinePointClick } from './types'

/** A vertical fade from the line color down to transparent, for area fills. */
export function gradientFill(color: string) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: withAlpha(color, 0.32) },
      { offset: 1, color: withAlpha(color, 0.02) },
    ],
  }
}

/** ECharts line-shape props from our `curve` union. */
export function curveProps(curve: LineCurve) {
  if (curve === 'smooth') return { smooth: true as const }
  if (curve === 'stepped') return { step: 'end' as const }
  return { smooth: false as const }
}

/** Normalize `value | value[] | undefined` into an array. */
export const toArray = <T>(value: T | T[] | undefined): T[] =>
  value == null ? [] : Array.isArray(value) ? value : [value]

/** Pull the numeric y-value from a plain number or an `[x, y]` pair. */
export const valueOf = (v: unknown): number =>
  Array.isArray(v) ? Number(v[1]) : Number(v)

/** Map an ECharts click event to a typed point payload. */
export function resolvePoint(params: EChartEventParams): LinePointClick {
  const raw = params.value
  const value = valueOf(raw)
  const x = Array.isArray(raw)
    ? (raw[0] as string | number)
    : (params.name ?? '')
  return {
    seriesName: params.seriesName ?? '',
    x,
    value: Number.isFinite(value) ? value : 0,
    index: params.dataIndex ?? -1,
  }
}
