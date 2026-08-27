import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type {
  ChartVariant,
  BaseLegendProps,
  ChartLoadingProps,
} from '@/components/charts/utils'

export type RadarVariant = ChartVariant

export type RadarPalette = 'brand' | 'categorical'

/** The outline of the web: a straight-edged `polygon` (default) or a `circle`. */
export type RadarShape = 'polygon' | 'circle'

/** One axis (spoke) of the web. `max`/`min` override the chart-level scale. */
export type RadarIndicator = {
  name: string
  max?: number
  min?: number
}

export type RadarSeries = {
  name: string
  /** One value per indicator, in the same order as `indicators`. */
  data: number[]
  variant?: RadarVariant
  color?: string
  /** Fill the polygon. Overrides the chart-level `area`. */
  area?: boolean
}

export type RadarSeriesClick = {
  name: string
  values: number[]
  index: number
}

export interface RadarProps extends BaseLegendProps, ChartLoadingProps {
  /** The axes of the web. Each series supplies one value per indicator. */
  indicators: RadarIndicator[]
  series: RadarSeries[]
  height?: number | string
  /** Chart title, centered above the web. */
  title?: string
  /** Subtitle shown beneath the title in a subtle color. */
  subtitle?: string
  palette?: RadarPalette
  shape?: RadarShape
  /** Scale applied to every indicator that doesn't set its own `max`. */
  max?: number
  /** Size of the web, e.g. `'70%'` or a px number. */
  radius?: number | string
  /** Fill every polygon. Override per series with `series[].area`. */
  area?: boolean
  lineWidth?: number
  showSymbol?: boolean
  symbolSize?: number
  /** Show the web's rings and spokes. */
  gridLines?: boolean
  /** Shade alternate rings for readability. */
  splitArea?: boolean
  showTooltip?: boolean
  /** On hover, highlight the hovered web and dim the rest. Off by default. */
  highlightOnHover?: boolean
  formatValue?: (value: number) => string
  animate?: boolean
  emptyMessage?: string
  onSeriesClick?: (payload: RadarSeriesClick) => void
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
