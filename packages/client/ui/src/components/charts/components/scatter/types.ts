import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type {
  ChartVariant,
  ValueAxisPosition,
  ValueAxisNamePosition,
  CategoryAxisNamePosition,
  AxisNameOrientation,
  BaseLegendProps,
  ChartLoadingProps,
} from '@/components/charts/utils'

export type {
  ValueAxisPosition,
  ValueAxisNamePosition,
  CategoryAxisNamePosition,
  AxisNameOrientation,
}

export type ScatterVariant = ChartVariant

export type ScatterPalette = 'brand' | 'categorical'

/** An `[x, y]` data point. */
export type ScatterPoint = [number, number]

export type ScatterXAxis = {
  name?: string
  /** Where the title sits along the axis: `left`, `middle`, or `right` (default). */
  position?: CategoryAxisNamePosition
  /** Title text direction: `horizontal` (default) or `vertical`. */
  orientation?: AxisNameOrientation
  min?: number
  max?: number
  format?: (value: number) => string
}

export type ScatterYAxis = {
  name?: string
  /** Which side the axis sits on: `left` (default) or `right`. */
  side?: ValueAxisPosition
  /** Where the title sits along the axis: `top` (default), `middle`, or `bottom`. */
  position?: ValueAxisNamePosition
  /** Title text direction: `horizontal` or `vertical` (rotated 90°). */
  orientation?: AxisNameOrientation
  min?: number
  max?: number
  format?: (value: number) => string
}

export type ScatterTrendLine = {
  from: ScatterPoint
  to: ScatterPoint
  label?: string
}

export type ScatterRegression = {
  points: ScatterPoint[]
  label?: string
  smooth?: boolean
}

/** The view a `Scatter` renders when it can morph into an aggregate bar. */
export type ScatterView = 'scatter' | 'bar'

/**
 * Enables morphing between the scatter and a bar of per-series aggregates
 * (via ECharts' `universalTransition`). Each series becomes one bar whose
 * value is its data averaged over `dimension` (0 = x, 1 = y; default 0).
 */
export type ScatterAggregate = {
  dimension?: 0 | 1
  /** Formats each bar's value label. */
  formatValue?: (value: number) => string
}

export type ScatterSeries = {
  name: string
  data: ScatterPoint[]
  variant?: ScatterVariant
  color?: string
  /** Marker size (px) for just this series. Overrides the chart-level `symbolSize`. */
  symbolSize?: number
  /** Draws a straight reference line from `from` to `to`, e.g. a fitted trend line. */
  trendLine?: ScatterTrendLine
  regression?: ScatterRegression
  /** Which panel this series plots into when `grid` defines multiple panels. */
  gridIndex?: number
}

/** One panel's position within a multi-panel layout (percentages or px). */
export type ScatterGrid = {
  left?: string | number
  right?: string | number
  top?: string | number
  bottom?: string | number
  width?: string | number
  height?: string | number
}

export type ScatterPointClick = {
  seriesName: string
  x: number
  y: number
  index: number
}

/** A dashed circle drawn behind a step's newest cluster, e.g. to show its spread. */
export type ScatterBoundary = {
  center: ScatterPoint
  radius: number
}

/** One frame of a `steps` timeline: its own series and optional cluster boundary. */
export type ScatterStep = {
  series: ScatterSeries[]
  boundary?: ScatterBoundary
  label?: string
}

export interface ScatterProps extends BaseLegendProps, ChartLoadingProps {
  /** Ignored when `steps` is set. */
  series?: ScatterSeries[]
  height?: number | string
  /** Chart title, centered above the plot. */
  title?: string
  /** Subtitle shown beneath the title in a subtle color. */
  subtitle?: string
  /** Show a crosshair (`axisPointer`) tracking the hovered point. */
  showCrosshair?: boolean
  palette?: ScatterPalette
  /** Marker size (px) for series that don't set their own. */
  symbolSize?: number
  xAxis?: ScatterXAxis
  yAxis?: ScatterYAxis
  /**
   * Number of columns when series span multiple panels (via `series[].gridIndex`).
   * The panels auto-lay out responsively and collapse to a single column on
   * narrow screens. Defaults to 2.
   */
  columns?: number
  gridLines?: boolean
  showTooltip?: boolean
  /**
   * Renders a timeline instead of a static chart: each entry is one frame's
   * `series` plus an optional `boundary` circle around its newest cluster.
   * When set, `series`/`columns` are ignored.
   */
  steps?: ScatterStep[]
  /** Autoplay the `steps` timeline on mount. Off by default. */
  autoPlay?: boolean
  /** Milliseconds between autoplay frames. */
  playInterval?: number
  /** On hover, highlight the whole series the point belongs to and dim the rest. Off by default. */
  highlightOnHover?: boolean
  /** Enables morphing to a bar of per-series aggregates (see `view`). */
  aggregate?: ScatterAggregate
  /** Which view to render when `aggregate` is set: the points or the bars. Defaults to `scatter`. Ignored when `autoToggle` is on. */
  view?: ScatterView
  /** Auto-cycle between the scatter and aggregate bar views on a timer (needs `aggregate`). */
  autoToggle?: boolean
  /** How long (ms) each view stays after its morph finishes before `autoToggle` flips it. Defaults to 1500. */
  holdDuration?: number
  /** Duration (ms) of the scatter↔bar morph and other update transitions. Defaults to 1000. */
  transitionDuration?: number
  formatValue?: (value: number) => string
  animate?: boolean
  emptyMessage?: string
  onPointClick?: (point: ScatterPointClick) => void
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
