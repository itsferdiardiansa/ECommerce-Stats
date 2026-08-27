import {
  readCssColor,
  lighten,
  resolveVariant,
  resolveCategoricalPalette,
  prefersReducedMotion,
  resolveAxisName,
  buildLegendOption,
  buildLineHighlight,
} from '@/components/charts/utils'
import type {
  LegendIcon,
  LegendAlign,
  LegendStyleOverrides,
} from '@/components/charts/utils'
import { curveProps, gradientFill } from '../line/helpers'
import type { MultiXLineXAxis, MultiXLineYAxis, LineCurve } from './types'

export interface BuildMultiXLineOptionParams {
  xAxes: MultiXLineXAxis[]
  curve: LineCurve
  area?: boolean | 'gradient'
  showLegend: boolean
  legendIcon?: LegendIcon
  legendAlign?: LegendAlign
  legendStyle?: LegendStyleOverrides
  min?: number
  max?: number
  yAxis?: MultiXLineYAxis
  showTooltip: boolean
  highlightOnHover: boolean
  formatValue: (value: number) => string
  animate: boolean
  emptyMessage: string
}

export function buildMultiXLineOption(params: BuildMultiXLineOptionParams) {
  const {
    xAxes: axes,
    curve,
    area,
    showLegend,
    legendIcon,
    legendAlign,
    legendStyle,
    min,
    max,
    yAxis,
    showTooltip,
    highlightOnHover,
    formatValue,
    animate,
    emptyMessage,
  } = params

  const valueAxisName = yAxis?.name
  const valueAxisNamePosition = yAxis?.position ?? 'middle'
  const valueFormat = yAxis?.format ?? formatValue
  const valueMin = yAxis?.min ?? min
  const valueMax = yAxis?.max ?? max

  const valuePlacement = valueAxisName
    ? resolveAxisName(valueAxisNamePosition, {
        orientation: 'vertical',
        side: 'left',
        inverse: yAxis?.inverse,
        rotation: yAxis?.orientation,
        labelExtent: 30,
      })
    : undefined

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

  const hasData = axes.some(ax => ax.series.some(item => item.data.length > 0))
  if (!axes.length || !hasData) {
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
  const shape = curveProps(curve)

  const axisColor = (a: MultiXLineXAxis, index: number): string =>
    a.color ??
    (a.series[0]?.variant
      ? resolveVariant(a.series[0].variant)
      : (a.series[0]?.color ?? categorical[index % categorical.length]))

  const xAxis: Record<string, unknown>[] = []
  const series: Record<string, unknown>[] = []
  const legendNames: string[] = []
  let topCount = 0
  let bottomCount = 0

  axes.forEach((axis, index) => {
    const accent = axisColor(axis, index)
    const onTop = index % 2 === 1
    if (onTop) topCount++
    else bottomCount++
    const offset = Math.floor(index / 2) * 28

    xAxis.push({
      type: 'category',
      data: axis.categories,
      position: onTop ? 'top' : 'bottom',
      offset,
      axisTick: { show: true, alignWithLabel: true },
      axisLine: { onZero: false, lineStyle: { color: accent } },
      axisLabel: { color: accent, fontSize: 12, hideOverlap: true },
      axisPointer: {
        label: {
          backgroundColor: surface,
          color: labelColor,
          borderColor: lineColor,
          borderWidth: 1,
          shadowBlur: 0,
          fontSize: 11,
          formatter: (p: {
            value: string | number
            seriesData?: Array<{ data: number }>
          }) => {
            const prefix = axis.name ? `${axis.name}  ` : ''
            const point = p.seriesData?.length
              ? `：${valueFormat(p.seriesData[0].data)}`
              : ''
            return `${prefix}${p.value}${point}`
          },
        },
      },
    })

    axis.series.forEach(item => {
      const color =
        item.color ?? (item.variant ? resolveVariant(item.variant) : accent)
      const hover = lighten(color)
      const areaMode = item.area ?? area
      const isGradient = areaMode === 'gradient'
      const fill = areaMode
        ? isGradient
          ? { color: gradientFill(color), opacity: 1 }
          : { color, opacity: 0.15 }
        : undefined
      legendNames.push(item.name)

      series.push({
        name: item.name,
        type: 'line',
        xAxisIndex: index,
        yAxisIndex: 0,
        data: item.data,
        ...shape,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color, width: 2 },
        itemStyle: { color, borderColor: surface, borderWidth: 1.5 },
        ...buildLineHighlight(color, {
          enabled: highlightOnHover,
          blurOpacity: 0.28,
          area: fill
            ? {
                emphasis: isGradient ? fill : { color: hover, opacity: 0.25 },
                blurOpacity: 0.05,
              }
            : undefined,
        }),
        ...(fill ? { areaStyle: fill } : {}),
      })
    })
  })

  const anyGradient = axes.some(ax =>
    ax.series.some(item => (item.area ?? area) === 'gradient')
  )

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    stateAnimation: {
      duration: anyGradient ? 0 : 300,
      easing: 'cubicOut' as const,
    },
    legend: buildLegendOption({
      shown: showLegend,
      data: legendNames,
      position: 'top',
      icon: legendIcon,
      align: legendAlign,
      colors: { label: labelColor, subtle, line: lineColor },
      style: legendStyle,
    }),
    tooltip: {
      show: showTooltip,
      trigger: 'none' as const,
      axisPointer: {
        type: 'cross' as const,
        crossStyle: { color: subtle, type: 'dashed' as const },
        lineStyle: { color: subtle, type: 'dashed' as const },
      },
    },
    grid: {
      left: 12,
      right: 24,
      top: (showLegend ? 34 : 12) + topCount * 26,
      bottom: 12 + bottomCount * 26,
      containLabel: true,
    },
    xAxis,
    yAxis: {
      type: 'value' as const,
      min: valueMin,
      max: valueMax,
      scale: valueMin == null && valueMax == null,
      inverse: yAxis?.inverse,
      name: valueAxisName,
      ...(valuePlacement
        ? {
            nameLocation: valuePlacement.nameLocation,
            nameRotate: valuePlacement.nameRotate,
            nameGap: valuePlacement.nameGap,
          }
        : {}),
      nameTextStyle: {
        color: subtle,
        fontSize: 11,
        ...(valuePlacement?.nameTextStyle ?? {}),
      },
      axisLabel: {
        color: subtle,
        fontSize: 11,
        formatter: (value: number) => valueFormat(value),
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: lineColor, type: 'dashed' as const },
      },
    },
    series,
  }
}
