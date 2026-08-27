import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type {
  ChartVariant,
  AxisLabelOverride,
  ValueAxisPosition,
  ValueAxisNamePosition,
  CategoryAxisNamePosition,
  AxisNameOrientation,
  BaseLegendProps,
  ChartLoadingProps,
} from '@/components/charts/utils'

export type {
  AxisLabelOverride,
  ValueAxisPosition,
  ValueAxisNamePosition,
  CategoryAxisNamePosition,
  AxisNameOrientation,
}

export type LineVariant = ChartVariant

export type LinePalette = 'brand' | 'categorical'

/** Line shape between points. */
export type LineCurve = 'smooth' | 'straight' | 'stepped'

/** Category x-axis (evenly spaced labels) or a true time axis. */
export type LineXAxisType = 'category' | 'time'

export type LineMarkPoint = 'max' | 'min'

/** An `[x, y]` pair — required when `xAxisType="time"` (x is a timestamp or date string). */
export type LinePoint = [number | string, number]

export type LineSeries = {
  name: string
  /** Plain values aligned to `categories`, or `[x, y]` pairs for a time axis. */
  data: number[] | LinePoint[]
  variant?: LineVariant
  color?: string
  /** Per-series override of the chart-level `curve`. */
  curve?: LineCurve
  /** Fill under the line. `true` is a flat tint; `'gradient'` fades to transparent. */
  area?: boolean | 'gradient'
  /** Give two or more series the same `stack` name to stack their areas. */
  stack?: string
  /** Render the line dashed. */
  dashed?: boolean
  /** Show the point markers for this series (overrides the chart-level `showSymbol`). */
  showSymbol?: boolean
  /** Per-series line thickness in px. */
  width?: number
  /**
   * Which y-axis this series is plotted against — an axis `id` or index from
   * `yAxes` (or `'left'`/`'right'`). Defaults to the first axis.
   */
  yAxis?: string | number
}

/**
 * A y-axis. Pass one or more to `yAxes` to build any layout — several on the
 * left and/or right, each with its own title and scale. Series bind to an axis
 * via `series[].yAxis` (its `id` or array index).
 */
export type LineYAxis = {
  /** Stable id to bind series to this axis. Falls back to the array index. */
  id?: string | number
  /** The axis title text. */
  name?: string
  /** Which side this axis sits on. Defaults to `'left'`. */
  side?: ValueAxisPosition
  min?: number
  max?: number
  /** Flip the axis so values grow downward — e.g. rainfall falling from the top. */
  inverse?: boolean
  /** Where the title sits along the axis: `top` (default), `middle`, or `bottom`. */
  position?: ValueAxisNamePosition
  /** Title text direction: `horizontal` or `vertical` (rotated 90°). */
  orientation?: AxisNameOrientation
  /** Format for this axis's tick labels and tooltip values. */
  format?: (value: number) => string
}

/**
 * The x-axis. A Line has a single x-axis (multiple x-axes are `MultiXLine`), so
 * this is one object rather than a list.
 */
export type LineXAxis = {
  /** The axis title text. */
  name?: string
  /** Where the title sits along the axis: `left`, `middle`, or `right` (default). */
  position?: CategoryAxisNamePosition
  /** Title text direction: `horizontal` (default) or `vertical` (rotated 90°). */
  orientation?: AxisNameOrientation
}

export type LineReferenceLine = {
  value: number
  label?: string
  /** Which axis the line sits on. Defaults to the value (`y`) axis. */
  axis?: 'x' | 'y'
  color?: string
}

export type LineMarkArea = {
  from: number | string
  to: number | string
  label?: string
  color?: string
  /** Band orientation. Defaults to a vertical band over the `x` axis (e.g. a time window). */
  axis?: 'x' | 'y'
}

/**
 * Color the line by where each point sits relative to a baseline — e.g. green
 * above the previous close, red below it. Applies to the first series.
 */
export type LineThreshold = {
  value: number
  /** Color (or variant) for segments at/above the baseline. Defaults to `success`. */
  above?: LineVariant | string
  /** Color (or variant) for segments below the baseline. Defaults to `destructive`. */
  below?: LineVariant | string
}

export interface LineProps extends BaseLegendProps, ChartLoadingProps {
  categories?: (string | number)[]
  series: LineSeries[]
  xAxisType?: LineXAxisType
  height?: number | string
  curve?: LineCurve
  area?: boolean | 'gradient'
  palette?: LinePalette
  showSymbol?: boolean
  symbolSize?: number
  lineWidth?: number
  connectNulls?: boolean
  showValueAxis?: boolean
  gridLines?: boolean
  /**
   * The y-axes: one or more, each `{ id?, name?, side?, min?, max?, inverse?,
   * position?, orientation?, format? }`. `name` is the axis title; `position`
   * (top/middle/bottom) and `orientation` place it. Bind series via
   * `series[].yAxis`. When omitted, a single auto-scaled axis is used.
   */
  yAxes?: LineYAxis[]
  /** The x-axis: `{ name?, position?, orientation? }` — `name` is its title. */
  xAxis?: LineXAxis
  /** Force the single y-axis min/max (ignored when `yAxes` is set). */
  min?: number
  max?: number
  axisLabelRotate?: number
  /** Escape hatch to customize the x-axis labels — e.g. rich labels with icons. */
  xAxisLabel?: AxisLabelOverride
  showTooltip?: boolean
  tooltipTrigger?: 'item' | 'axis'
  /** On hover, focus the hovered series and dim the rest. Off by default. */
  highlightOnHover?: boolean
  threshold?: LineThreshold
  referenceLine?: LineReferenceLine | LineReferenceLine[]
  markArea?: LineMarkArea | LineMarkArea[]
  markPoints?: LineMarkPoint[]
  zoom?: boolean
  zoomSlider?: boolean
  /** Initial zoom window as `[startPercent, endPercent]` (0–100). Requires `zoom`. */
  zoomWindow?: [number, number]
  /** Show the ECharts toolbox (box-zoom, restore, save as image). */
  toolbox?: boolean
  /** Minimal axis-less trend line for KPI cards and inline sparklines. */
  sparkline?: boolean
  formatValue?: (value: number) => string
  /** Formats x-axis ticks and the tooltip header — handy for time axes. */
  formatX?: (value: string | number) => string
  animate?: boolean
  emptyMessage?: string
  onPointClick?: (point: LinePointClick) => void
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}

export type LinePointClick = {
  seriesName: string
  x: string | number
  value: number
  index: number
}
