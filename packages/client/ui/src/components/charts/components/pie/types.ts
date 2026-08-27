import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type {
  ChartVariant,
  BaseLegendProps,
  ChartLoadingProps,
} from '@/components/charts/utils'

export type PiePalette = 'brand' | 'categorical'

export type PieRoseType = 'radius' | 'area' | false

export type PieLabelPosition = 'outside' | 'inside' | 'center'

export type PieLabelAlignTo = 'none' | 'labelLine' | 'edge'

export type PieCoord = number | string

export type PieDetailRow = {
  icon?: string
  label?: string
  cells: string[]
}

export type PieDetail = {
  title?: string
  columns: string[]
  rows: PieDetailRow[]
  padding?: number | number[]
}

export type PieCustomLabel = {
  formatter: string | string[]
  rich?: Record<string, unknown>
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number | number[]
  padding?: number | number[]
  width?: number | string
  align?: 'left' | 'center' | 'right'
  color?: string
  fontSize?: number
  lineHeight?: number
}

export type PieGeo = {
  map: string
  roam?: boolean
  layoutCenter?: [PieCoord, PieCoord]
  layoutSize?: PieCoord
  aspectScale?: number
  areaColor?: string
  borderColor?: string
}

export type PieCalendar = {
  range: string | [string, string]
  cellSize?: number | [number, number]
  orient?: 'horizontal' | 'vertical'
  top?: PieCoord
  left?: PieCoord
  right?: PieCoord
  bottom?: PieCoord
  firstDay?: number
  dayNames?: string[]
  showDayNumbers?: boolean
  showMonthLabel?: boolean
  showYearLabel?: boolean
  cellColor?: string
  borderColor?: string
}

export type PieDatum = {
  label: string
  value: number
  variant?: ChartVariant
  color?: string
  selected?: boolean
  detail?: PieDetail
  richLabel?: PieCustomLabel
}

export type PieSeries = {
  name?: string
  data: PieDatum[]
  innerRadius?: PieCoord
  outerRadius?: PieCoord
  center?: [PieCoord, PieCoord]
  date?: string
  startAngle?: number
  endAngle?: number
  padAngle?: number
  borderRadius?: number
  roseType?: PieRoseType
  selectedMode?: false | 'single' | 'multiple'
  showLabels?: boolean
  labelPosition?: PieLabelPosition
  labelAlignTo?: PieLabelAlignTo
  showLabelLine?: boolean
  labelLineLength?: number
  richLabel?: PieCustomLabel
}

export type PieLabelDatum = {
  name: string
  value: number
  percent: number
}

export interface PieProps extends BaseLegendProps, ChartLoadingProps {
  data?: PieDatum[]
  series?: PieSeries[]
  height?: number | string
  innerRadius?: PieCoord
  outerRadius?: PieCoord
  center?: [PieCoord, PieCoord]
  geo?: PieGeo
  calendar?: PieCalendar
  startAngle?: number
  endAngle?: number
  padAngle?: number
  borderRadius?: number
  roseType?: PieRoseType
  palette?: PiePalette
  showLabels?: boolean
  labelOnHover?: boolean
  labelOnClick?: boolean
  labelPosition?: PieLabelPosition
  labelAlignTo?: PieLabelAlignTo
  showLabelLine?: boolean
  labelFormatter?: (datum: PieLabelDatum) => string
  showTooltip?: boolean
  scrollableLegend?: boolean
  highlightOnHover?: boolean
  selectedMode?: false | 'single' | 'multiple'
  formatValue?: (value: number) => string
  animate?: boolean
  emptyMessage?: string
  compact?: boolean
  stackDetailBelow?: number | false
  onSliceClick?: (datum: PieDatum, index: number) => void
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
