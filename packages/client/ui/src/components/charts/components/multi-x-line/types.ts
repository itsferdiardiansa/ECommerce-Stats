import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type {
  ValueAxisNamePosition,
  AxisNameOrientation,
  BaseLegendProps,
  ChartLoadingProps,
} from '@/components/charts/utils'
import type { LineVariant, LineCurve } from '../line/types'

export type {
  LineVariant,
  LineCurve,
  ValueAxisNamePosition,
  AxisNameOrientation,
}

export type MultiXSeries = {
  name: string
  data: number[]
  variant?: LineVariant
  color?: string
  /** Fill under the line. Overrides the chart-level `area`. */
  area?: boolean | 'gradient'
}

/**
 * One x-axis and the series plotted against it. The first sits on the bottom,
 * the second on top, and any further axes alternate (offset outward).
 */
export type MultiXLineXAxis = {
  /** Category labels for this x-axis. */
  categories: (string | number)[]
  /** Axis title; also used in the crosshair readout. */
  name?: string
  /** Axis + default series color. Falls back to the series variant, then the palette. */
  color?: string
  /** Series plotted against this x-axis (usually one). */
  series: MultiXSeries[]
}

/** The shared value (y) axis. */
export type MultiXLineYAxis = {
  name?: string
  /** Where the title sits along the axis: `top`, `middle` (default, rotated), or `bottom`. */
  position?: ValueAxisNamePosition
  /** Title text direction: `horizontal` or `vertical` (rotated 90°). */
  orientation?: AxisNameOrientation
  min?: number
  max?: number
  inverse?: boolean
  format?: (value: number) => string
}

export interface MultiXLineProps
  extends Omit<BaseLegendProps, 'legendPosition'>,
    ChartLoadingProps {
  /**
   * The x-axes to overlay on a shared value axis. The first sits on the bottom,
   * the second on top, and any further axes alternate (offset outward). Each
   * carries its own categories, color, and series.
   */
  xAxes: MultiXLineXAxis[]
  /** The shared value (y) axis: `{ name?, position?, orientation?, min?, max?, inverse?, format? }`. */
  yAxis?: MultiXLineYAxis
  height?: number | string
  curve?: LineCurve
  /** Default fill under each line; override per series. */
  area?: boolean | 'gradient'
  /** Force the value-axis minimum / maximum. */
  min?: number
  max?: number
  /** Show the hover crosshair with a per-axis value readout. */
  showTooltip?: boolean
  /** On hover, highlight the whole series and dim the rest. On by default. */
  highlightOnHover?: boolean
  formatValue?: (value: number) => string
  animate?: boolean
  emptyMessage?: string
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
