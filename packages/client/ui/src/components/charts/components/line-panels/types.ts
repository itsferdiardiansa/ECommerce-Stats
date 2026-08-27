import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type { ChartLoadingProps } from '@/components/charts/utils'
import type {
  LineVariant,
  LineCurve,
  LineXAxisType,
  LinePoint,
} from '../line/types'

export type { LineVariant, LineCurve, LineXAxisType, LinePoint }

export type LinePanelSeries = {
  name: string
  /** Plain values aligned to `categories`, or `[x, y]` pairs on a time axis. */
  data: number[] | LinePoint[]
  variant?: LineVariant
  color?: string
  /** Fill under the line. Overrides the chart-level `area`. */
  area?: boolean | 'gradient'
  /** Line shape. Overrides the chart-level `curve`. */
  curve?: LineCurve
  /** Show a point marker on every data point (off by default). */
  showSymbol?: boolean
}

export type LinePanel = {
  /** Panel title, shown as the value-axis name. */
  label?: string
  series: LinePanelSeries[]
  /** Grow values downward (e.g. the rainfall panel in a hydrology chart). */
  inverse?: boolean
  min?: number
  max?: number
  /** Per-panel value formatter (falls back to the chart-level `formatValue`). */
  formatValue?: (value: number) => string
}

export interface LinePanelsProps extends ChartLoadingProps {
  /** Shared x-axis labels for `xAxisType="category"`. */
  categories?: (string | number)[]
  xAxisType?: LineXAxisType
  /** The stacked panels, top to bottom. Each is its own grid + value axis. */
  panels: LinePanel[]
  height?: number | string
  /** Default fill under each line; override per series. */
  area?: boolean | 'gradient'
  /** Default line shape for every panel. */
  curve?: LineCurve
  /** A single dataZoom that scrubs every panel's x range together. */
  zoom?: boolean
  /** Show the draggable zoom slider. Set to `false` for inside-only zoom. */
  zoomSlider?: boolean
  /** Show the x-axis labels on every panel, not just the bottom one. */
  xAxisPerPanel?: boolean
  showTooltip?: boolean
  /** Show the sticky value tag on the x-axis under the hover crosshair. */
  axisPointerLabel?: boolean
  formatValue?: (value: number) => string
  /** Formats x-axis ticks and the tooltip header (handy for time axes). */
  formatX?: (value: string | number) => string
  animate?: boolean
  emptyMessage?: string
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
