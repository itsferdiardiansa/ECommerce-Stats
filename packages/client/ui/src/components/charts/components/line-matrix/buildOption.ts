import {
  readCssColor,
  lighten,
  withAlpha,
  resolveVariant,
  prefersReducedMotion,
} from '@/components/charts/utils'
import { curveProps, valueOf } from '../line/helpers'
import type { LineMatrixCell, LineMatrixRow, LineCurve } from './types'

export interface BuildLineMatrixOptionParams {
  columns: (string | number)[]
  rows: (string | LineMatrixRow)[]
  cells: LineMatrixCell[]
  cornerLabel?: string
  area: boolean
  curve: LineCurve
  colorByTrend: boolean
  zoom: boolean
  zoomSlider: boolean
  showCellLabel: boolean
  formatValue: (value: number) => string
  formatX?: (value: string | number) => string
  animate: boolean
  emptyMessage: string
}

type RowItem = { label: string; divider: boolean }

export function buildLineMatrixOption(params: BuildLineMatrixOptionParams) {
  const {
    columns,
    rows,
    cells,
    cornerLabel,
    area,
    curve,
    colorByTrend,
    zoom,
    zoomSlider,
    showCellLabel,
    formatValue,
    formatX,
    animate,
    emptyMessage,
  } = params

  const labelColor = readCssColor('--text-color-ds-default', 'rgb(23, 23, 23)')
  const subtle = readCssColor('--text-color-ds-subtle', 'rgb(82, 82, 82)')
  const lineColor = readCssColor(
    '--border-color-ds-default',
    'rgb(229, 229, 229)'
  )
  const surface = readCssColor(
    '--background-color-ds-elevation-surface-raised',
    'rgb(255, 255, 255)'
  )
  const neutralBg = readCssColor(
    '--background-color-ds-neutral',
    'rgb(245, 245, 245)'
  )
  const up = resolveVariant('success')
  const down = resolveVariant('destructive')

  if (!cells.length) {
    return {
      title: {
        text: emptyMessage,
        left: 'center',
        top: 'middle',
        textStyle: {
          color: subtle,
          fontSize: 13,
          fontWeight: 'normal' as const,
        },
      },
    }
  }

  const rowItems: RowItem[] = rows.map(row =>
    typeof row === 'string'
      ? { label: row, divider: false }
      : { label: row.label, divider: Boolean(row.divider) }
  )

  const shape = curveProps(curve)

  const grid: Record<string, unknown>[] = []
  const xAxis: Record<string, unknown>[] = []
  const yAxis: Record<string, unknown>[] = []
  const series: Record<string, unknown>[] = []

  cells.forEach((cell, index) => {
    const id = `cell-${index}`
    const first = cell.data.length ? valueOf(cell.data[0]) : 0
    const last = cell.data.length ? valueOf(cell.data[cell.data.length - 1]) : 0
    const net = last - first
    const color =
      cell.color ??
      (cell.variant
        ? resolveVariant(cell.variant)
        : colorByTrend
          ? net >= 0
            ? up
            : down
          : resolveVariant('primary'))
    const hover = lighten(color)

    grid.push({
      id,
      coordinateSystem: 'matrix',
      coord: [cell.col, cell.row],
      top: 8,
      bottom: 8,
      left: 6,
      right: 6,
      containLabel: true,
    })
    xAxis.push({
      type: 'category',
      id,
      gridId: id,
      scale: true,
      axisTick: { show: false },
      axisLabel: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
    })
    yAxis.push({
      id,
      gridId: id,
      scale: true,
      interval: Number.MAX_SAFE_INTEGER,
      axisLabel: showCellLabel
        ? {
            showMaxLabel: true,
            showMinLabel: false,
            fontSize: 9,
            color: subtle,
            formatter: (value: number) => formatValue(value),
          }
        : { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    })
    series.push({
      name: cell.row,
      xAxisId: id,
      yAxisId: id,
      type: 'line',
      symbol: 'none',
      ...shape,
      lineStyle: { width: 1.4, color },
      ...(area ? { areaStyle: { color: withAlpha(color, 0.12) } } : {}),
      emphasis: {
        focus: 'none' as const,
        lineStyle: { color: hover, width: 1.8 },
        ...(area ? { areaStyle: { color: withAlpha(color, 0.22) } } : {}),
      },
      data: cell.data,
    })
  })

  const yData = rowItems.map(rowItem => ({
    value: rowItem.divider ? '' : rowItem.label,
  }))

  const bodyData = rowItems
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.divider)
    .map(({ r, i }) => ({
      coord: [null, i],
      coordClamp: true,
      mergeCells: true,
      value: r.label,
      label: { color: subtle, fontSize: 12, fontWeight: 600 },
      itemStyle: { color: neutralBg, borderColor: lineColor },
    }))

  const cellBorder = { itemStyle: { borderColor: lineColor } }

  const dataZoom = zoom
    ? [
        ...(zoomSlider
          ? [
              {
                type: 'slider' as const,
                xAxisIndex: 'all',
                left: '8%',
                right: '8%',
                bottom: 22,
                height: 20,
                throttle: 100,
                borderColor: lineColor,
                fillerColor: withAlpha(subtle, 0.12),
                dataBackground: {
                  lineStyle: { color: lineColor },
                  areaStyle: { color: neutralBg },
                },
                selectedDataBackground: {
                  lineStyle: { color: subtle },
                  areaStyle: { color: withAlpha(subtle, 0.18) },
                },
                textStyle: { color: subtle, fontSize: 10 },
                handleStyle: { color: surface, borderColor: subtle },
                moveHandleStyle: { color: subtle },
              },
            ]
          : []),
        { type: 'inside' as const, xAxisIndex: 'all', throttle: 100 },
      ]
    : undefined

  const option = {
    animation: animate && !prefersReducedMotion(),
    matrix: {
      x: {
        data: columns,
        levelSize: 34,
        label: { fontSize: 12, color: subtle, fontWeight: 600 },
        ...cellBorder,
      },
      y: {
        data: yData,
        levelSize: 86,
        label: { fontSize: 12, color: labelColor },
        ...cellBorder,
      },
      corner: {
        data: cornerLabel ? [{ coord: [-1, -1], value: cornerLabel }] : [],
        label: { fontSize: 11, color: subtle },
        ...cellBorder,
      },
      body: { data: bodyData, ...cellBorder },
      top: 36,
      bottom: zoom && zoomSlider ? 70 : 24,
      width: '92%',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: surface,
      borderColor: lineColor,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: labelColor, fontSize: 11 },
      extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      formatter: (
        params: Array<{
          axisValue?: string | number
          seriesName?: string
          value?: [string | number, number] | number
        }>
      ) => {
        const arr = Array.isArray(params) ? params : [params]
        const p = arr[0]
        if (!p) return ''
        const head = formatX
          ? formatX(p.axisValue ?? '')
          : String(p.axisValue ?? '')
        const val = Array.isArray(p.value)
          ? Number(p.value[1])
          : Number(p.value)
        return `${p.seriesName} · ${head}<br/><strong>${formatValue(val)}</strong>`
      },
    },
    ...(dataZoom ? { dataZoom } : {}),
    grid,
    xAxis,
    yAxis,
    series,
  }

  return option
}
