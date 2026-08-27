import type { CSSProperties } from 'react'
import type { ECharts } from 'echarts/core'
import type { ChartLoadingProps } from '@/components/charts/utils'
import type { LineVariant, LineCurve, LinePoint } from '../line/types'

export type { LineVariant, LineCurve, LinePoint }

/** A row in the matrix. A `divider` row spans the full width as a group label. */
export type LineMatrixRow = {
  label: string
  divider?: boolean
}

/** One small line chart placed at the (`col`, `row`) cell of the matrix. */
export type LineMatrixCell = {
  col: string | number
  row: string
  data: number[] | LinePoint[]
  variant?: LineVariant
  color?: string
}

export interface LineMatrixProps extends ChartLoadingProps {
  /** Column labels (the matrix x dimension). */
  columns: (string | number)[]
  /** Row labels (the matrix y dimension); strings or `{ label, divider }`. */
  rows: (string | LineMatrixRow)[]
  /** The cells to plot. Each is one mini line chart at its (`col`, `row`). */
  cells: LineMatrixCell[]
  height?: number | string
  /** Label shown in the top-left corner cell. */
  cornerLabel?: string
  /** Fill under each cell line. */
  area?: boolean
  /** Line shape inside every cell. */
  curve?: LineCurve
  /** Color each cell green/red by whether it ended up or down over its data. */
  colorByTrend?: boolean
  /** Add a shared dataZoom that scrubs every cell's x range together. */
  zoom?: boolean
  /** Show the draggable zoom slider. Set to `false` to keep only inside (scroll/drag) zoom. */
  zoomSlider?: boolean
  /** Show the per-cell max value label on the y axis. */
  showCellLabel?: boolean
  formatValue?: (value: number) => string
  /** Formats the tooltip header (e.g. a timestamp). */
  formatX?: (value: string | number) => string
  animate?: boolean
  emptyMessage?: string
  onReady?: (chart: ECharts) => void
  className?: string
  style?: CSSProperties
}
