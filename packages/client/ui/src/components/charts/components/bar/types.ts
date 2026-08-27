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
  LegendIcon,
  ChartLoadingProps,
} from '@/components/charts/utils'

export type {
  ValueAxisPosition,
  ValueAxisNamePosition,
  CategoryAxisNamePosition,
  AxisNameOrientation,
}

/**
 * The x-axis (horizontal). For vertical bars this is the category axis; for
 * horizontal bars it's the value axis, so `min`/`max`/`format`/`inverse` apply.
 */
export type BarXAxis = {
  name?: string
  /** Where the title sits along the axis: `left`, `middle`, or `right` (default). */
  position?: CategoryAxisNamePosition
  /** Title text direction: `horizontal` (default) or `vertical`. */
  orientation?: AxisNameOrientation
  min?: number
  max?: number
  inverse?: boolean
  format?: (value: number) => string
}

/**
 * The y-axis (vertical). For vertical bars this is the value axis, so
 * `min`/`max`/`format`/`inverse` apply; for horizontal bars it's the category axis.
 */
export type BarYAxis = {
  name?: string
  /** Which side the axis sits on: `left` (default) or `right`. */
  side?: ValueAxisPosition
  /** Where the title sits along the axis: `top` (default), `middle`, or `bottom`. */
  position?: ValueAxisNamePosition
  /** Title text direction: `horizontal` or `vertical` (rotated 90°). */
  orientation?: AxisNameOrientation
  min?: number
  max?: number
  inverse?: boolean
  format?: (value: number) => string
}

export type BarVariant = ChartVariant

export type BarPalette = 'brand' | 'categorical'

export type BarSort = 'none' | 'asc' | 'desc'

export type BarStackMode = 'normal' | 'percent'

export type BarZoom = boolean | 'category' | 'value' | 'both'

export type BarBrushSelection = {
  indices: number[]
  labels: string[]
}

export type BarReferenceLine = {
  value: number
  label?: string
}

export type BarMarkPoint = 'max' | 'min'

export type BarAxisBreak = {
  start: number
  end: number
  gap?: number | string
}

export type BarAxisBreakCollapse = {
  text?: string
  offset?: [number, number]
  textStyle?: {
    color?: string
    fontSize?: number
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number
  }
  buttonStyle?: {
    fill?: string
    stroke?: string
    borderRadius?: number
    paddingX?: number
  }
}

export type BarDatum = {
  label: string
  value: number
  variant?: BarVariant
  color?: string
}

export type BarSeries = {
  name: string
  data: number[]
  variant?: BarVariant
  color?: string
  silent?: boolean
  stack?: string
  /** Overrides the chart-level `legendIcon` for just this series' legend entry. */
  legendIcon?: LegendIcon
}

export interface BarProps extends BaseLegendProps, ChartLoadingProps {
  data?: BarDatum[]
  categories?: string[]
  series?: BarSeries[]
  max?: number
  min?: number
  showValues?: boolean
  formatValue?: (value: number) => string
  direction?: 'horizontal' | 'vertical'
  height?: number | string
  showTooltip?: boolean
  tooltipTrigger?: 'item' | 'axis'
  axisPointerLabel?: boolean
  showValueAxis?: boolean
  stacked?: boolean
  stackMode?: BarStackMode
  /** On hover, highlight the whole series the bar belongs to and dim the rest. Off by default. */
  highlightOnHover?: boolean
  showTrack?: boolean
  trackColor?: string
  gridLines?: boolean
  palette?: BarPalette
  barRadius?: number
  barWidth?: number
  sort?: BarSort
  referenceLine?: BarReferenceLine | 'average'
  markPoints?: BarMarkPoint[]
  axisBreaks?: BarAxisBreak[]
  axisBreakExpandable?: boolean
  axisBreakCollapse?: BarAxisBreakCollapse
  zoom?: BarZoom
  zoomSlider?: boolean
  selectable?: boolean
  axisLabelRotate?: number
  /** The x-axis (horizontal): `{ name?, position?, orientation?, min?, max?, inverse?, format? }`. */
  xAxis?: BarXAxis
  /** The y-axis (vertical): `{ name?, side?, position?, orientation?, min?, max?, inverse?, format? }`. */
  yAxis?: BarYAxis
  /** Escape hatch to customize the x-axis labels — e.g. rich labels with icons. */
  xAxisLabel?: AxisLabelOverride
  animate?: boolean
  emptyMessage?: string
  onBarClick?: (datum: BarDatum, index: number) => void
  onBarHover?: (datum: BarDatum, index: number) => void
  onBarLeave?: () => void
  onBrushSelect?: (selection: BarBrushSelection) => void
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
