import {
  readCssColor,
  lighten,
  resolveVariant,
  resolveCategoricalPalette,
  prefersReducedMotion,
  buildLegendOption,
  buildItemHighlight,
} from '@/components/charts/utils'
import type {
  LegendPosition,
  LegendIcon,
  LegendAlign,
  LegendStyleOverrides,
} from '@/components/charts/utils'
import type {
  PolarBarDatum,
  PolarBarSeries,
  PolarBarOrientation,
  PolarBarPalette,
} from './types'

export interface BuildPolarBarOptionParams {
  data: PolarBarDatum[]
  categories?: string[]
  series?: PolarBarSeries[]
  orientation: PolarBarOrientation
  stacked: boolean
  highlightOnHover: boolean
  max?: number
  min?: number
  showValues: boolean
  showTooltip: boolean
  showLegend?: boolean
  legendPosition: LegendPosition
  legendIcon?: LegendIcon
  legendAlign?: LegendAlign
  legendStyle?: LegendStyleOverrides
  palette: PolarBarPalette
  barRadius: number
  roundCap: boolean
  startAngle: number
  endAngle?: number
  formatValue: (value: number) => string
  labelFormatter?: (datum: { name: string; value: number }) => string
  animate: boolean
  emptyMessage: string
}

export function buildPolarBarOption(params: BuildPolarBarOptionParams) {
  const {
    data,
    categories,
    series,
    orientation,
    stacked,
    highlightOnHover,
    max,
    min,
    showValues,
    showTooltip,
    showLegend,
    legendPosition,
    legendIcon,
    legendAlign,
    legendStyle,
    palette,
    barRadius,
    roundCap,
    startAngle,
    endAngle,
    formatValue,
    labelFormatter,
    animate,
    emptyMessage,
  } = params

  const labelColor = readCssColor('--text-color-ds-default', 'rgb(23, 23, 23)')
  const subtleColor = readCssColor('--text-color-ds-subtle', 'rgb(82, 82, 82)')
  const lineColor = readCssColor(
    '--border-color-ds-default',
    'rgb(229, 229, 229)'
  )
  const surface = readCssColor(
    '--background-color-ds-elevation-surface-raised',
    'rgb(255, 255, 255)'
  )

  const grouped = Boolean(series?.length && categories?.length)

  if (grouped ? !categories?.length : !data.length) {
    return {
      title: {
        text: emptyMessage,
        left: 'center',
        top: 'middle',
        textStyle: {
          color: subtleColor,
          fontSize: 13,
          fontWeight: 'normal' as const,
        },
      },
    }
  }

  const isAngular = orientation === 'angular'
  const categorical = resolveCategoricalPalette()
  const cats = grouped ? (categories as string[]) : data.map(item => item.label)

  const label = {
    show: showValues || Boolean(labelFormatter),
    position: 'middle' as const,
    color: readCssColor('--text-color-ds-inverse', 'rgb(250, 250, 250)'),
    fontSize: 11,
    textBorderWidth: 0,
    formatter: (p: { name: string; value: number }) =>
      labelFormatter
        ? labelFormatter({ name: p.name, value: p.value })
        : formatValue(p.value),
  }

  let seriesList: unknown[]
  if (grouped) {
    const list = series as PolarBarSeries[]
    seriesList = list.map((item, index) => {
      const color =
        item.color ??
        (item.variant
          ? resolveVariant(item.variant)
          : categorical[index % categorical.length])
      return {
        name: item.name,
        type: 'bar',
        coordinateSystem: 'polar',
        stack: stacked ? 'total' : undefined,
        roundCap,
        data: item.data,
        itemStyle: { color, borderRadius: barRadius },
        ...buildItemHighlight(color, highlightOnHover),
        label,
      }
    })
  } else {
    seriesList = [
      {
        type: 'bar',
        coordinateSystem: 'polar',
        roundCap,
        data: data.map((item, index) => {
          const color =
            item.color ??
            (item.variant
              ? resolveVariant(item.variant)
              : palette === 'categorical'
                ? categorical[index % categorical.length]
                : resolveVariant('primary'))
          return {
            value: item.value,
            itemStyle: { color, borderRadius: barRadius },
            emphasis: { itemStyle: { color: lighten(color) } },
          }
        }),
        label,
      },
    ]
  }

  const categoryAxis = {
    type: 'category' as const,
    data: cats,
    z: isAngular ? 0 : 60,
    axisLine: { lineStyle: { color: lineColor } },
    axisTick: { show: false },
    axisLabel: {
      color: labelColor,
      fontSize: 12,
      ...(isAngular
        ? {}
        : {
            backgroundColor: surface,
            borderColor: lineColor,
            borderWidth: 1,
            borderRadius: 4,
            padding: [2, 6] as [number, number],
          }),
    },
  }

  const valueAxis = {
    type: 'value' as const,
    max,
    min,
    axisLabel: {
      color: subtleColor,
      fontSize: 11,
      formatter: (value: number) => formatValue(value),
      ...(isAngular
        ? {
            backgroundColor: surface,
            borderColor: lineColor,
            borderWidth: 1,
            borderRadius: 4,
            padding: [1, 5] as [number, number],
          }
        : {}),
    },
    splitLine: {
      show: true,
      lineStyle: { color: lineColor, type: 'dashed' as const },
    },
    axisLine: { show: false },
  }

  const legendShown = grouped && (showLegend ?? true)

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    polar: { radius: ['20%', '75%'] },
    angleAxis: isAngular
      ? { ...categoryAxis, startAngle, endAngle }
      : { ...valueAxis, startAngle, endAngle },
    radiusAxis: isAngular ? valueAxis : categoryAxis,
    legend: buildLegendOption({
      shown: legendShown,
      data: grouped
        ? (series as PolarBarSeries[]).map(item => item.name)
        : undefined,
      position: legendPosition,
      icon: legendIcon,
      align: legendAlign,
      colors: { label: labelColor, subtle: subtleColor, line: lineColor },
      style: legendStyle,
    }),
    tooltip: {
      show: showTooltip,
      trigger: 'item',
      backgroundColor: surface,
      borderColor: lineColor,
      borderWidth: 1,
      padding: [4, 8],
      textStyle: { color: labelColor, fontSize: 11 },
      extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      formatter: (
        p:
          | { name: string; value: number; seriesName?: string }
          | { name: string; value: number; seriesName?: string }[]
      ) => {
        const item = Array.isArray(p) ? p[0] : p
        const head =
          grouped && item.seriesName
            ? `${item.name} · ${item.seriesName}`
            : item.name
        return `${head}: ${formatValue(item.value)}`
      },
    },
    series: seriesList,
  }
}
