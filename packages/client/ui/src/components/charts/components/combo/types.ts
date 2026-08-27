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

export type ComboSeriesType = 'bar' | 'line' | 'area'

export type ComboSeries = {
  name: string
  type: ComboSeriesType
  data: number[]
  variant?: ChartVariant
  color?: string
  /**
   * Which y-axis this series is plotted against — an axis `id` or index from
   * `yAxes` (or `'left'`/`'right'`). Defaults to the first axis.
   */
  yAxis?: string | number
  smooth?: boolean
  stack?: string
}

/**
 * A y-axis. Pass one or more to `yAxes` — several on the left and/or right, each
 * with its own title and scale. Series bind to an axis via `series[].yAxis`.
 */
export type ComboYAxis = {
  /** Stable id to bind series to this axis. Falls back to the array index. */
  id?: string | number
  /** The axis title text. */
  name?: string
  /** Which side this axis sits on. Defaults to `'left'`. */
  side?: ValueAxisPosition
  min?: number
  max?: number
  /** Flip the axis so values grow downward. */
  inverse?: boolean
  /** Where the title sits along the axis: `top` (default), `middle`, or `bottom`. */
  position?: ValueAxisNamePosition
  /** Title text direction: `horizontal` or `vertical` (rotated 90°). */
  orientation?: AxisNameOrientation
  /** Format for this axis's tick labels and tooltip values. */
  format?: (value: number) => string
  /** Accent color for this axis's line, labels, and title. */
  color?: string
}

/** The x-axis. */
export type ComboXAxis = {
  /** The axis title text. */
  name?: string
  /** Where the title sits along the axis: `left`, `middle`, or `right` (default). */
  position?: CategoryAxisNamePosition
  /** Title text direction: `horizontal` (default) or `vertical` (rotated 90°). */
  orientation?: AxisNameOrientation
}

/**
 * A part-to-whole pie drawn above the grid, sharing the chart's series, colors
 * and legend. It re-encodes to whichever category the axis pointer is on, so
 * hovering the plot moves the pie with it.
 */
export type ComboSummaryPie = {
  /** Which category the pie starts on. Defaults to the last. */
  activeIndex?: number
  /** Share of the chart height given to the pie, `0`–`1`. Defaults to `0.5`. */
  share?: number
  /** Inner hole radius (px or `%`). Set it for a doughnut. */
  innerRadius?: number | string
  /** Outer radius (px or `%` of the chart's shorter side). */
  outerRadius?: number | string
  /** Draw `name: value (percent%)` beside each slice. Defaults to `true`. */
  showLabels?: boolean
  /** Fired when the axis pointer moves the pie to a new category. */
  onActiveIndexChange?: (index: number, category: string) => void
}

export interface ComboProps extends BaseLegendProps, ChartLoadingProps {
  categories: string[]
  series: ComboSeries[]
  height?: number | string
  showValues?: boolean
  showTooltip?: boolean
  gridLines?: boolean
  /** On hover, highlight the whole series and dim the rest. Off by default. */
  highlightOnHover?: boolean
  barRadius?: number
  axisLabelRotate?: number
  /**
   * The y-axes: one or more, each `{ id?, name?, side?, min?, max?, inverse?,
   * position?, orientation?, format?, color? }`. `name` is the axis title;
   * `position`/`orientation` place it. Bind series with `series[].yAxis`.
   */
  yAxes?: ComboYAxis[]
  /** The x-axis: `{ name?, position?, orientation? }` — `name` is its title. */
  xAxis?: ComboXAxis
  /** Escape hatch to customize the x-axis labels — e.g. rich labels with icons. */
  xAxisLabel?: AxisLabelOverride
  /**
   * Draw a part-to-whole pie above the grid, linked to the axis pointer. Pass
   * `true` for defaults, or an object to tune it.
   */
  summaryPie?: boolean | ComboSummaryPie
  animate?: boolean
  emptyMessage?: string
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
