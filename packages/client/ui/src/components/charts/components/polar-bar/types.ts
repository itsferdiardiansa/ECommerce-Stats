import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type {
  ChartVariant,
  BaseLegendProps,
  ChartLoadingProps,
} from '@/components/charts/utils'

export type PolarBarOrientation = 'angular' | 'radial'

export type PolarBarPalette = 'brand' | 'categorical'

export type PolarBarDatum = {
  label: string
  value: number
  variant?: ChartVariant
  color?: string
}

export type PolarBarSeries = {
  name: string
  data: number[]
  variant?: ChartVariant
  color?: string
}

export interface PolarBarProps extends BaseLegendProps, ChartLoadingProps {
  data?: PolarBarDatum[]
  categories?: string[]
  series?: PolarBarSeries[]
  orientation?: PolarBarOrientation
  height?: number | string
  stacked?: boolean
  /** On hover, highlight the whole series the segment belongs to and dim the rest. Off by default. */
  highlightOnHover?: boolean
  max?: number
  min?: number
  showValues?: boolean
  showTooltip?: boolean
  palette?: PolarBarPalette
  barRadius?: number
  roundCap?: boolean
  startAngle?: number
  endAngle?: number
  formatValue?: (value: number) => string
  labelFormatter?: (datum: { name: string; value: number }) => string
  animate?: boolean
  emptyMessage?: string
  onBarClick?: (datum: PolarBarDatum, index: number) => void
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
