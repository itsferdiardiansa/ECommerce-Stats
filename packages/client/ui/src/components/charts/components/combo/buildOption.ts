import {
  readCssColor,
  lighten,
  resolveVariant,
  resolveCategoricalPalette,
  prefersReducedMotion,
  resolveAxisName,
  buildLegendOption,
  legendReserveSide,
  buildItemHighlight,
  buildLineHighlight,
} from '@/components/charts/utils'
import type {
  AxisLabelOverride,
  ValueAxisPosition,
  ValueAxisNamePosition,
  AxisNameOrientation,
  LegendPosition,
  LegendIcon,
  LegendAlign,
  LegendStyleOverrides,
} from '@/components/charts/utils'
import type {
  ComboSeries,
  ComboYAxis,
  ComboXAxis,
  ComboSummaryPie,
} from './types'
import { buildPieOption } from '../pie/buildOption'

export interface BuildComboOptionParams {
  categories: string[]
  series: ComboSeries[]
  showValues: boolean
  showTooltip: boolean
  showLegend: boolean
  legendPosition: LegendPosition
  legendIcon?: LegendIcon
  legendAlign?: LegendAlign
  legendStyle?: LegendStyleOverrides
  gridLines: boolean
  highlightOnHover: boolean
  barRadius: number
  axisLabelRotate: number
  yAxes?: ComboYAxis[]
  xAxis?: ComboXAxis
  xAxisLabel?: AxisLabelOverride
  summaryPie?: ComboSummaryPie
  activeIndex?: number
  animate: boolean
  emptyMessage: string
}

const identity = (value: number) => String(value)

const LEGEND_RESERVE = 52
const LEGEND_ICON_WIDTH = 20
const LEGEND_CHAR_WIDTH = 6.8
const LEGEND_GAP = 24

export const SUMMARY_PIE_ID = 'combo-summary-pie'

export function resolveSeriesColors(series: ComboSeries[]): string[] {
  const categorical = resolveCategoricalPalette()
  return series.map(
    (item, index) =>
      item.color ??
      (item.variant
        ? resolveVariant(item.variant)
        : categorical[index % categorical.length])
  )
}

type PieSeriesOption = { data: unknown[] } & Record<string, unknown>

/**
 * The summary pie is a real `Pie` series — built by `buildPieOption` so its
 * hover, emphasis, labels and colors are identical to the `Pie` component's.
 * Only the placement (center/radius) and id are Combo's.
 */
export function buildSummaryPieSeries(
  series: ComboSeries[],
  colors: string[],
  activeIndex: number,
  opts: {
    center: [string, string]
    innerRadius?: number | string
    outerRadius: number | string
    showLabels: boolean
    format: (value: number) => string
    animate: boolean
  }
): PieSeriesOption {
  const built = buildPieOption({
    data: series.map((item, index) => ({
      label: item.name,
      value: item.data[activeIndex] ?? 0,
      color: colors[index],
    })),
    innerRadius: opts.innerRadius,
    outerRadius: opts.outerRadius,
    center: opts.center,
    startAngle: 90,
    padAngle: 0,
    borderRadius: 0,
    roseType: false,
    palette: 'categorical',
    showLabels: opts.showLabels,
    labelOnHover: false,
    labelOnClick: false,
    labelPosition: 'outside',
    labelAlignTo: 'none',
    showLabelLine: true,
    labelFormatter: d => `${d.name}: ${opts.format(d.value)} (${d.percent}%)`,
    showTooltip: false,
    showLegend: false,
    legendPosition: 'bottom',
    scrollableLegend: false,
    highlightOnHover: true,
    selectedMode: false,
    formatValue: opts.format,
    animate: opts.animate,
    emptyMessage: '',
  }) as { series?: PieSeriesOption[] }

  const pie = built.series?.[0] ?? ({ data: [] } as PieSeriesOption)
  return { ...pie, id: SUMMARY_PIE_ID, tooltip: { show: false } }
}

/** Just the slice data, for merging a new active category into a live chart. */
export function summaryPieData(
  series: ComboSeries[],
  colors: string[],
  activeIndex: number
): unknown[] {
  return buildSummaryPieSeries(series, colors, activeIndex, {
    center: ['50%', '50%'],
    outerRadius: '50%',
    showLabels: true,
    format: String,
    animate: true,
  }).data
}

export function buildComboOption(params: BuildComboOptionParams) {
  const {
    categories,
    series,
    showValues,
    showTooltip,
    showLegend,
    legendPosition,
    legendIcon,
    legendAlign,
    legendStyle,
    gridLines,
    highlightOnHover,
    barRadius,
    axisLabelRotate,
    yAxes,
    xAxis,
    xAxisLabel,
    summaryPie,
    activeIndex = 0,
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

  if (!series.length || !categories.length) {
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

  const categorical = resolveCategoricalPalette()

  const colorFor = (s: ComboSeries, index: number): string =>
    s.color ??
    (s.variant
      ? resolveVariant(s.variant)
      : categorical[index % categorical.length])

  const seriesColors = series.map((item, index) => colorFor(item, index))

  type NormAxis = {
    key: string
    name?: string
    side: ValueAxisPosition
    position: ValueAxisNamePosition
    orientation?: AxisNameOrientation
    min?: number
    max?: number
    inverse: boolean
    format: (value: number) => string
    color?: string
  }

  const axes: NormAxis[] = yAxes?.length
    ? yAxes.map((yAx, index) => ({
        key: String(yAx.id ?? index),
        name: yAx.name,
        side: yAx.side ?? 'left',
        position: yAx.position ?? 'top',
        orientation: yAx.orientation,
        min: yAx.min,
        max: yAx.max,
        inverse: yAx.inverse ?? false,
        format: yAx.format ?? identity,
        color: yAx.color,
      }))
    : [
        {
          key: 'left',
          side: 'left',
          position: 'top',
          inverse: false,
          format: identity,
        },
      ]

  const manyAxes = axes.length > 1
  const axisIndex = new Map(axes.map((ax, index) => [ax.key, index]))
  const OFFSET_STEP = 52
  const axisOffset = new Map<string, number>()
  ;(['left', 'right'] as const).forEach(side => {
    let k = 0
    axes.forEach(ax => {
      if (ax.side === side) {
        axisOffset.set(ax.key, k * OFFSET_STEP)
        k++
      }
    })
  })

  const seriesAxisIndex = (y: string | number | undefined): number => {
    if (y == null) return 0
    if (typeof y === 'number') return y >= 0 && y < axes.length ? y : 0
    if (axisIndex.has(y)) return axisIndex.get(y) as number
    if (y === 'right') {
      const r = axes.findIndex(ax => ax.side === 'right')
      return r >= 0 ? r : 0
    }
    if (y === 'left') {
      const l = axes.findIndex(ax => ax.side === 'left')
      return l >= 0 ? l : 0
    }
    return 0
  }

  const formatForSeries = (s?: ComboSeries) =>
    axes[seriesAxisIndex(s?.yAxis)]?.format ?? identity

  const seriesList = series.map((item, index) => {
    const color = seriesColors[index]
    const yAxisIndex = seriesAxisIndex(item.yAxis)
    const label = {
      show: showValues,
      position: 'top' as const,
      color: labelColor,
      fontSize: 11,
      textBorderWidth: 0,
      formatter: (p: { value: number }) => formatForSeries(item)(p.value),
    }

    if (item.type === 'bar') {
      return {
        name: item.name,
        type: 'bar',
        yAxisIndex,
        stack: item.stack,
        data: item.data,
        barMaxWidth: 32,
        itemStyle: {
          color,
          borderRadius: [barRadius, barRadius, 0, 0],
        },
        ...buildItemHighlight(color, highlightOnHover, 0.2, true),
        label,
      }
    }

    const hover = lighten(color)
    return {
      name: item.name,
      type: 'line',
      yAxisIndex,
      data: item.data,
      smooth: item.smooth ?? false,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: true,
      ...(summaryPie ? { triggerLineEvent: true } : {}),
      lineStyle: { color, width: 2 },
      itemStyle: { color, borderColor: surface, borderWidth: 1.5 },
      ...buildLineHighlight(color, {
        width: 2,
        enabled: highlightOnHover,
        alwaysFocusSeries: true,
        area:
          item.type === 'area'
            ? { emphasis: { color: hover, opacity: 0.25 }, blurOpacity: 0.06 }
            : undefined,
      }),
      ...(item.type === 'area' ? { areaStyle: { color, opacity: 0.15 } } : {}),
      label,
    }
  })

  const catName = xAxis?.name
  const catPlacement = catName
    ? resolveAxisName(xAxis?.position ?? 'right', {
        orientation: 'horizontal',
        rotation: xAxis?.orientation,
        nameWidth: Math.ceil(catName.length * 6.5),
        labelExtent: 22 + (axisLabelRotate ? 12 : 0),
      })
    : undefined

  const placements = axes.map(ax =>
    ax.name
      ? resolveAxisName(ax.position, {
          orientation: 'vertical',
          side: ax.side,
          inverse: ax.inverse,
          rotation: ax.orientation,
          labelExtent: 44 + (axisOffset.get(ax.key) ?? 0),
          nameWidth: Math.ceil(ax.name.length * 6.5),
        })
      : undefined
  )

  const colorForAxisIndex = (idx: number) => {
    const si = series.findIndex(item => seriesAxisIndex(item.yAxis) === idx)
    return si >= 0 ? seriesColors[si] : undefined
  }

  const yAxisList = axes.map((ax, index) => {
    const p = placements[index]
    const accent = ax.color ?? colorForAxisIndex(index) ?? subtleColor
    const off = axisOffset.get(ax.key) ?? 0
    return {
      type: 'value' as const,
      name: ax.name,
      ...(p
        ? {
            nameLocation: p.nameLocation,
            nameRotate: p.nameRotate,
            nameGap: p.nameGap,
          }
        : {}),
      min: ax.min,
      max: ax.max,
      inverse: ax.inverse,
      position: ax.side,
      ...(manyAxes ? { offset: off, alignTicks: true } : {}),
      nameTextStyle: {
        color: manyAxes ? accent : subtleColor,
        fontSize: 11,
        ...(p?.nameTextStyle ?? {}),
      },
      splitLine: {
        show: index === 0 && gridLines,
        lineStyle: { color: lineColor, type: 'dashed' as const },
      },
      axisLine: manyAxes
        ? { show: true, lineStyle: { color: accent } }
        : { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: manyAxes ? accent : labelColor,
        fontSize: 12,
        formatter: (value: number) => ax.format(value),
      },
      axisPointer: {
        label: {
          formatter: (pt: { value: number }) => ax.format(Math.round(pt.value)),
          backgroundColor: surface,
          color: labelColor,
          borderColor: lineColor,
          borderWidth: 1,
          shadowBlur: 0,
        },
      },
    }
  })

  const yAxis = yAxisList

  const reserveFor = (s: 'left' | 'right' | 'top' | 'bottom') => {
    let m =
      catPlacement && catPlacement.reserveSide === s ? catPlacement.reserve : 0
    placements.forEach((placement, index) => {
      if (placement && placement.reserveSide === s) {
        m = Math.max(
          m,
          placement.reserve + (axisOffset.get(axes[index].key) ?? 0)
        )
      }
    })
    if (s === 'left' || s === 'right') {
      const maxOff = axes.reduce(
        (acc, ax) =>
          ax.side === s ? Math.max(acc, axisOffset.get(ax.key) ?? 0) : acc,
        0
      )
      if (maxOff > 0) m = Math.max(m, maxOff + 56)
    }
    return m
  }

  const longestLegendLabel = series.reduce(
    (acc, item) => Math.max(acc, (item.name ?? '').length),
    0
  )
  const legendSideReserve = Math.round(
    LEGEND_ICON_WIDTH + longestLegendLabel * LEGEND_CHAR_WIDTH + LEGEND_GAP
  )

  const legendTopPct =
    showLegend && legendReserveSide(legendPosition) === 'top' ? 9 : 0
  const pieShare = summaryPie ? (summaryPie.share ?? 0.5) : 0
  const pieBandPct = pieShare * 100
  const pieOuter = summaryPie?.outerRadius ?? `${Math.round(pieShare * 56)}%`

  const pieSeries = summaryPie
    ? [
        buildSummaryPieSeries(series, seriesColors, activeIndex, {
          center: ['50%', `${pieBandPct / 2 + legendTopPct}%`],
          innerRadius: summaryPie.innerRadius,
          outerRadius: pieOuter,
          showLabels: summaryPie.showLabels ?? true,
          format: formatForSeries(series[0]),
          animate,
        }),
      ]
    : []

  const xAxisOption = {
    type: 'category' as const,
    data: categories,
    name: catName,
    ...(catPlacement
      ? {
          nameLocation: catPlacement.nameLocation,
          nameRotate: catPlacement.nameRotate,
          nameGap: catPlacement.nameGap,
        }
      : {}),
    nameTextStyle: {
      color: subtleColor,
      fontSize: 11,
      ...(catPlacement?.nameTextStyle ?? {}),
    },
    axisLine: { show: true, lineStyle: { color: lineColor } },
    axisTick: { show: false },
    axisLabel: {
      color: labelColor,
      fontSize: 12,
      rotate: axisLabelRotate,
      ...xAxisLabel,
    },
    axisPointer: { type: 'shadow' as const },
  }

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    legend: buildLegendOption({
      shown: showLegend,
      data: series.map(item => item.name),
      position: legendPosition,
      icon: legendIcon,
      align: legendAlign,
      colors: { label: labelColor, subtle: subtleColor, line: lineColor },
      style: legendStyle,
    }),
    grid: {
      left: Math.max(
        8,
        (showLegend && legendReserveSide(legendPosition) === 'left'
          ? legendSideReserve
          : 0) + reserveFor('left')
      ),
      right: Math.max(
        8,
        (showLegend && legendReserveSide(legendPosition) === 'right'
          ? legendSideReserve
          : 0) + reserveFor('right')
      ),
      top: summaryPie
        ? `${pieBandPct + legendTopPct}%`
        : Math.max(
            (showLegend && legendReserveSide(legendPosition) === 'top'
              ? LEGEND_RESERVE
              : 0) + reserveFor('top'),
            12
          ),
      bottom: Math.max(
        (showLegend && legendReserveSide(legendPosition) === 'bottom'
          ? LEGEND_RESERVE
          : 0) + reserveFor('bottom'),
        axisLabelRotate ? 24 : 0,
        8
      ),
      containLabel: true,
    },
    tooltip: {
      show: showTooltip,
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        triggerEmphasis: false,
        crossStyle: { color: subtleColor, type: 'dashed' },
        lineStyle: { color: subtleColor, type: 'dashed' },
        label: {
          backgroundColor: surface,
          color: labelColor,
          borderColor: lineColor,
          borderWidth: 1,
          shadowBlur: 0,
        },
      },
      backgroundColor: surface,
      borderColor: lineColor,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: labelColor, fontSize: 11 },
      extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      formatter: (
        args: Array<{
          axisValueLabel?: string
          name?: string
          seriesName?: string
          value: number
          marker?: string
        }>
      ) => {
        const arr = Array.isArray(args) ? args : [args]
        const head = arr[0]?.axisValueLabel ?? arr[0]?.name ?? ''
        const rows = arr
          .map(p => {
            const s = series.find(item => item.name === p.seriesName)
            const fmt = formatForSeries(s)
            return `${p.marker ?? ''}${p.seriesName}: ${fmt(p.value)}`
          })
          .join('<br/>')
        return `${head}<br/>${rows}`
      },
    },
    xAxis: xAxisOption,
    yAxis,
    series: [...seriesList, ...pieSeries],
  }
}
