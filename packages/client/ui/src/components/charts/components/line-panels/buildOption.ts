import {
  readCssColor,
  lighten,
  withAlpha,
  resolveVariant,
  resolveCategoricalPalette,
  prefersReducedMotion,
} from '@/components/charts/utils'
import { curveProps, gradientFill, valueOf } from '../line/helpers'
import type { LinePanel, LineCurve, LineXAxisType } from './types'

export interface BuildLinePanelsOptionParams {
  categories?: (string | number)[]
  xAxisType: LineXAxisType
  panels: LinePanel[]
  area?: boolean | 'gradient'
  curve: LineCurve
  zoom: boolean
  zoomSlider: boolean
  xAxisPerPanel: boolean
  showTooltip: boolean
  axisPointerLabel: boolean
  formatValue: (value: number) => string
  formatX?: (value: string | number) => string
  animate: boolean
  emptyMessage: string
}

export function buildLinePanelsOption(params: BuildLinePanelsOptionParams) {
  const {
    categories,
    xAxisType,
    panels,
    area,
    curve,
    zoom,
    zoomSlider,
    xAxisPerPanel,
    showTooltip,
    axisPointerLabel,
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

  const hasData = panels.some(panel =>
    panel.series.some(item => item.data.length > 0)
  )
  if (!panels.length || !hasData) {
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

  const categorical = resolveCategoricalPalette()
  const fmtX = formatX ?? ((value: string | number) => String(value))
  const anyGradient = panels.some(panel =>
    panel.series.some(item => (item.area ?? area) === 'gradient')
  )

  const n = panels.length
  const topPad = 6
  const gap = xAxisPerPanel ? 11 : 7
  const bottomPad = zoom && zoomSlider ? 15 : 6
  const panelH = (100 - topPad - bottomPad - gap * (n - 1)) / n

  const grid: Record<string, unknown>[] = []
  const xAxis: Record<string, unknown>[] = []
  const yAxis: Record<string, unknown>[] = []
  const series: Record<string, unknown>[] = []
  const fmtBySeries: Record<string, (value: number) => string> = {}
  let colorIndex = 0

  panels.forEach((panel, pi) => {
    const isLast = pi === n - 1
    const fmt = panel.formatValue ?? formatValue

    grid.push({
      left: 60,
      right: 24,
      top: `${topPad + pi * (panelH + gap)}%`,
      height: `${panelH}%`,
    })

    xAxis.push({
      type: xAxisType,
      gridIndex: pi,
      position: panel.inverse ? ('top' as const) : undefined,
      ...(xAxisType === 'category'
        ? { data: categories, boundaryGap: false }
        : {}),
      ...(axisPointerLabel ? {} : { axisPointer: { label: { show: false } } }),
      axisLine: { show: true, onZero: false, lineStyle: { color: lineColor } },
      axisTick: { show: false },
      axisLabel:
        xAxisPerPanel || isLast
          ? {
              color: labelColor,
              fontSize: 12,
              hideOverlap: true,
              formatter:
                xAxisType === 'time'
                  ? (value: number) => fmtX(value)
                  : undefined,
            }
          : { show: false },
      splitLine: { show: false },
    })

    yAxis.push({
      type: 'value',
      gridIndex: pi,
      name: panel.label,
      nameTextStyle: { color: subtle, fontSize: 11, align: 'left' },
      nameGap: 10,
      inverse: panel.inverse,
      min: panel.min,
      max: panel.max,
      scale: panel.min == null && panel.max == null,
      axisLabel: {
        color: subtle,
        fontSize: 11,
        formatter: (value: number) => fmt(value),
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: lineColor, type: 'dashed' as const },
      },
    })

    panel.series.forEach(item => {
      const color =
        item.color ??
        (item.variant
          ? resolveVariant(item.variant)
          : categorical[colorIndex % categorical.length])
      colorIndex++
      fmtBySeries[item.name] = fmt

      const areaMode = item.area ?? area
      const isGradient = areaMode === 'gradient'
      const fill = areaMode
        ? isGradient
          ? { color: gradientFill(color), opacity: 1 }
          : { color, opacity: 0.15 }
        : undefined
      const hover = lighten(color)

      series.push({
        name: item.name,
        type: 'line',
        xAxisIndex: pi,
        yAxisIndex: pi,
        data: item.data,
        ...curveProps(item.curve ?? curve),
        showSymbol: item.showSymbol ?? false,
        symbol: 'circle',
        symbolSize: 6,
        ...(item.data.length > 200 ? { sampling: 'lttb' as const } : {}),
        lineStyle: { color, width: 2 },
        itemStyle: { color, borderColor: surface, borderWidth: 1.5 },
        emphasis: {
          focus: 'none' as const,
          lineStyle: { color: hover },
          itemStyle: { color: hover },
          ...(fill
            ? { areaStyle: isGradient ? fill : { color: hover, opacity: 0.25 } }
            : {}),
        },
        ...(fill ? { areaStyle: fill } : {}),
      })
    })
  })

  const allX = panels.map((_, index) => index)
  const dataZoom = zoom
    ? [
        ...(zoomSlider
          ? [
              {
                type: 'slider' as const,
                xAxisIndex: allX,
                left: 60,
                right: 24,
                bottom: 12,
                height: 18,
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
        { type: 'inside' as const, xAxisIndex: allX },
      ]
    : undefined

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    stateAnimation: {
      duration: anyGradient ? 0 : 300,
      easing: 'cubicOut' as const,
    },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    tooltip: showTooltip
      ? {
          trigger: 'axis',
          backgroundColor: surface,
          borderColor: lineColor,
          borderWidth: 1,
          padding: [6, 10],
          textStyle: { color: labelColor, fontSize: 11 },
          extraCssText:
            'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
          axisPointer: {
            type: 'cross' as const,
            crossStyle: { color: subtle, type: 'dashed' as const },
            lineStyle: { color: subtle, type: 'dashed' as const },
            label: {
              backgroundColor: surface,
              color: labelColor,
              borderColor: lineColor,
              borderWidth: 1,
              shadowBlur: 0,
              fontSize: 11,
            },
          },
          formatter: (
            args: Array<{
              axisValue?: string | number
              axisValueLabel?: string
              seriesName?: string
              value?: [string | number, number] | number
              marker?: string
            }>
          ) => {
            const arr = Array.isArray(args) ? args : [args]
            const head = fmtX(arr[0]?.axisValue ?? arr[0]?.axisValueLabel ?? '')
            const rows = arr
              .map(item => {
                const fmt = fmtBySeries[item.seriesName ?? ''] ?? formatValue
                return `${item.marker ?? ''}${item.seriesName}: ${fmt(valueOf(item.value))}`
              })
              .join('<br/>')
            return `${head}<br/>${rows}`
          },
        }
      : { show: false },
    ...(dataZoom ? { dataZoom } : {}),
    grid,
    xAxis,
    yAxis,
    series,
  }
}
