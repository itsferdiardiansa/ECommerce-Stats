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
} from '@/components/charts/utils'
import type {
  AxisLabelOverride,
  LegendPosition,
  LegendIcon,
  LegendAlign,
  LegendStyleOverrides,
} from '@/components/charts/utils'
import type {
  BarDatum,
  BarSeries,
  BarPalette,
  BarSort,
  BarStackMode,
  BarZoom,
  BarMarkPoint,
  BarAxisBreak,
  BarReferenceLine,
  BarXAxis,
  BarYAxis,
} from './types'

export interface BuildBarOptionParams {
  data: BarDatum[]
  categories?: string[]
  series?: BarSeries[]
  max?: number
  min?: number
  isHorizontal: boolean
  showValues: boolean
  formatValue: (value: number) => string
  showTooltip: boolean
  tooltipTrigger: 'item' | 'axis'
  axisPointerLabel: boolean
  showValueAxis: boolean
  showLegend?: boolean
  legendPosition: LegendPosition
  legendIcon?: LegendIcon
  legendAlign?: LegendAlign
  legendStyle?: LegendStyleOverrides
  stacked: boolean
  stackMode: BarStackMode
  highlightOnHover: boolean
  showTrack: boolean
  trackColor?: string
  gridLines?: boolean
  palette: BarPalette
  barRadius: number
  barWidth?: number
  sort: BarSort
  referenceLine?: BarReferenceLine | 'average'
  markPoints: BarMarkPoint[]
  axisBreaks: BarAxisBreak[]
  axisBreakExpandable: boolean
  zoom: BarZoom
  zoomSlider: boolean
  selectable: boolean
  axisLabelRotate: number
  xAxis?: BarXAxis
  yAxis?: BarYAxis
  xAxisLabel?: AxisLabelOverride
  animate: boolean
  emptyMessage: string
}

/** Sorts a copy of the data by value when requested. */
export function orderBarData(data: BarDatum[], sort: BarSort): BarDatum[] {
  if (sort === 'none') return data
  return [...data].sort((a, b) =>
    sort === 'asc' ? a.value - b.value : b.value - a.value
  )
}

/** The category labels in the exact order ECharts renders them. */
export function getBarCategories(p: {
  data: BarDatum[]
  categories?: string[]
  series?: BarSeries[]
  sort: BarSort
  isHorizontal: boolean
}): string[] {
  const grouped = Boolean(p.series?.length && p.categories?.length)
  const cats = grouped
    ? (p.categories as string[])
    : orderBarData(p.data, p.sort).map(item => item.label)
  return p.isHorizontal ? [...cats].reverse() : cats
}

export function buildBarOption(params: BuildBarOptionParams) {
  const {
    data,
    categories,
    series,
    max,
    min,
    isHorizontal,
    showValues,
    formatValue,
    showTooltip,
    tooltipTrigger,
    axisPointerLabel,
    showValueAxis,
    showLegend,
    legendPosition,
    legendIcon,
    legendAlign,
    legendStyle,
    stacked,
    stackMode,
    highlightOnHover,
    showTrack,
    trackColor,
    gridLines,
    palette,
    barRadius,
    barWidth,
    sort,
    referenceLine,
    markPoints,
    axisBreaks,
    axisBreakExpandable,
    zoom,
    zoomSlider,
    selectable,
    axisLabelRotate,
    xAxis,
    yAxis,
    xAxisLabel,
    animate,
    emptyMessage,
  } = params

  // Spatial axes: which of x/y holds values flips with `direction`.
  const valueCfg = isHorizontal ? xAxis : yAxis
  const catCfg = isHorizontal ? yAxis : xAxis
  const valueAxisName = valueCfg?.name
  const categoryAxisName = catCfg?.name
  const valueAxisNamePosition = valueCfg?.position ?? 'top'
  const categoryAxisNamePosition = catCfg?.position ?? 'right'
  const valueAxisPosition = yAxis?.side ?? 'left'
  const valueFormat = valueCfg?.format ?? formatValue

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

  if (!grouped && !data.length) {
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

  const percent = stackMode === 'percent'
  const stacking = stacked || percent
  const categorical = resolveCategoricalPalette()

  const borderRadius = isHorizontal
    ? [0, barRadius, barRadius, 0]
    : [barRadius, barRadius, 0, 0]
  const flatRadius = [0, 0, 0, 0]

  const trackFill =
    trackColor ??
    readCssColor('--background-color-ds-neutral', 'rgb(245, 245, 245)')

  const inverseColor = readCssColor(
    '--text-color-ds-inverse',
    'rgb(250, 250, 250)'
  )

  const labelBase = {
    show: showValues,
    formatter: (p: { value: number }) => valueFormat(p.value),
    textBorderWidth: 0,
    fontSize: 12,
  }
  const labelOutside = {
    ...labelBase,
    position: (isHorizontal ? 'right' : 'top') as 'right' | 'top',
    color: labelColor,
  }
  const labelInside = {
    ...labelBase,
    position: 'inside' as const,
    color: inverseColor,
  }

  const isAverage = referenceLine === 'average'
  const fixedRef =
    referenceLine && referenceLine !== 'average' ? referenceLine : undefined

  const fixedMarkLine = fixedRef
    ? {
        silent: true,
        symbol: 'none' as const,
        lineStyle: { color: subtleColor, type: 'dashed' as const, width: 1 },
        label: {
          show: true,
          position: 'end' as const,
          distance: 8,
          rotate: 0,
          color: subtleColor,
          fontSize: 11,
          backgroundColor: surface,
          borderColor: lineColor,
          borderWidth: 1,
          borderRadius: 4,
          padding: [2, 6] as [number, number],
          formatter: () => fixedRef.label ?? valueFormat(fixedRef.value),
        },
        data: [
          isHorizontal ? { xAxis: fixedRef.value } : { yAxis: fixedRef.value },
        ],
      }
    : undefined

  const makeAverageMarkLine = (color: string) => ({
    silent: true,
    symbol: 'none' as const,
    lineStyle: { color, type: 'dashed' as const, width: 1.5 },
    label: {
      position: 'end' as const,
      color,
      fontSize: 11,
      formatter: (p: { value: number }) => valueFormat(Math.round(p.value)),
    },
    data: [{ type: 'average' as const, name: 'Avg' }],
  })

  const singleAverageColor =
    palette === 'categorical' ? subtleColor : resolveVariant('primary')

  const markPointData = markPoints.map(type => ({ type }))
  const makeMarkPoint = (color: string) =>
    markPoints.length
      ? {
          symbol: 'pin' as const,
          symbolSize: 42,
          data: markPointData,
          itemStyle: { color },
          emphasis: { disabled: true },
          label: {
            color: inverseColor,
            fontSize: 11,
            formatter: (p: { value: number }) => valueFormat(p.value),
          },
        }
      : undefined

  let cats: string[]
  let seriesList: unknown[]

  if (grouped) {
    cats = categories as string[]
    const list = series as BarSeries[]
    const defaultStack = stacking ? 'total' : undefined
    const stackOf = (s: BarSeries) => s.stack ?? defaultStack
    const anyStacked = list.some(item => Boolean(stackOf(item)))
    const groupWidth = barWidth ?? (anyStacked ? (isHorizontal ? 12 : 40) : 28)
    const lastInStack = new Map<string, number>()
    list.forEach((item, index) => {
      const sk = stackOf(item)
      if (sk) lastInStack.set(sk, index)
    })
    const totals = percent
      ? cats.map((_, ci) =>
          list.reduce((sum, item) => sum + (item.data[ci] ?? 0), 0)
        )
      : []
    seriesList = list.map((item, index) => {
      const color =
        item.color ??
        (item.variant
          ? resolveVariant(item.variant)
          : categorical[index % categorical.length])
      const seriesStack = stackOf(item)
      const isInnerStacked = Boolean(
        seriesStack && lastInStack.get(seriesStack) !== index
      )
      const radius = isInnerStacked ? flatRadius : borderRadius
      const withTrack = showTrack && index === 0
      const values = percent
        ? item.data.map((item, ci) =>
            totals[ci] > 0 ? (item / totals[ci]) * 100 : 0
          )
        : item.data
      return {
        name: item.name,
        type: 'bar',
        stack: seriesStack,
        silent: item.silent ?? false,
        data: isHorizontal ? [...values].reverse() : values,
        itemStyle: { color, borderRadius: radius },
        ...buildItemHighlight(color, highlightOnHover),
        barMaxWidth: groupWidth,
        label: item.silent
          ? { show: false }
          : seriesStack
            ? labelInside
            : labelOutside,
        markLine: item.silent
          ? undefined
          : isAverage
            ? makeAverageMarkLine(color)
            : index === 0
              ? fixedMarkLine
              : undefined,
        markPoint: item.silent ? undefined : makeMarkPoint(color),
        showBackground: withTrack,
        backgroundStyle: withTrack
          ? { color: trackFill, borderRadius: barRadius }
          : undefined,
      }
    })
  } else {
    const ordered = orderBarData(data, sort)
    cats = ordered.map(item => item.label)
    const negativeRadius = isHorizontal
      ? [barRadius, 0, 0, barRadius]
      : [0, 0, barRadius, barRadius]
    const seriesData = ordered.map((datum, index) => {
      const color =
        datum.color ??
        (datum.variant
          ? resolveVariant(datum.variant)
          : palette === 'categorical'
            ? categorical[index % categorical.length]
            : resolveVariant('primary'))
      return {
        value: datum.value,
        itemStyle: {
          color,
          borderRadius: datum.value < 0 ? negativeRadius : borderRadius,
        },
        emphasis: { itemStyle: { color: lighten(color) } },
      }
    })
    seriesList = [
      {
        type: 'bar',
        data: isHorizontal ? [...seriesData].reverse() : seriesData,
        barMaxWidth: barWidth ?? (isHorizontal ? 12 : 40),
        label: labelOutside,
        markLine: isAverage
          ? makeAverageMarkLine(singleAverageColor)
          : fixedMarkLine,
        markPoint: makeMarkPoint(resolveVariant('primary')),
        showBackground: showTrack,
        backgroundStyle: showTrack
          ? { color: trackFill, borderRadius: barRadius }
          : undefined,
      },
    ]
  }

  const legendShown = grouped && (showLegend ?? true)
  const showGrid = gridLines ?? showValueAxis

  const valueAxis = {
    type: 'value' as const,
    max: percent ? 100 : (valueCfg?.max ?? max),
    min: percent ? 0 : (valueCfg?.min ?? min),
    inverse: valueCfg?.inverse,
    name: valueAxisName,
    position: isHorizontal ? undefined : valueAxisPosition,
    nameTextStyle: {
      color: subtleColor,
      fontSize: 11,
      align: 'right' as const,
      padding: [0, 8, 0, 0] as [number, number, number, number],
    },
    splitLine: {
      show: showGrid,
      lineStyle: { color: lineColor, type: 'dashed' as const },
    },
    axisLabel: showValueAxis
      ? {
          color: labelColor,
          fontSize: 12,
          formatter: (value: number) => valueFormat(value),
        }
      : { show: false },
    axisTick: { show: false },
    axisLine: { show: false },
    breaks: axisBreaks.length ? axisBreaks : undefined,
    breakArea: axisBreaks.length
      ? {
          show: true,
          expandOnClick: axisBreakExpandable,
          zigzagZ: 200,
          itemStyle: {
            color: surface,
            borderColor: subtleColor,
            borderType: 'dashed' as const,
            borderWidth: 1,
            opacity: 1,
          },
        }
      : undefined,
  }

  const categoryAxis = {
    type: 'category' as const,
    data: isHorizontal ? [...cats].reverse() : cats,
    name: categoryAxisName,
    nameTextStyle: { color: subtleColor, fontSize: 11 },
    axisLine: { show: showValueAxis, lineStyle: { color: lineColor } },
    axisTick: { show: false },
    axisLabel: {
      color: labelColor,
      fontSize: 12,
      rotate: axisLabelRotate,
      hideOverlap: true,
    },
  }

  const categoryZoomDim = isHorizontal ? 'yAxisIndex' : 'xAxisIndex'
  const valueZoomDim = isHorizontal ? 'xAxisIndex' : 'yAxisIndex'
  const zoomCategory = zoom === true || zoom === 'category' || zoom === 'both'
  const zoomValue = zoom === 'value' || zoom === 'both'
  const zoomDims = [
    ...(zoomCategory ? [categoryZoomDim] : []),
    ...(zoomValue ? [valueZoomDim] : []),
  ]
  const showVSlider = zoomSlider && zoomDims.includes('yAxisIndex')
  const showHSlider = zoomSlider && zoomDims.includes('xAxisIndex')

  const filterModeFor = (dim: string) =>
    dim === valueZoomDim ? ('none' as const) : ('filter' as const)

  const catCount = Math.max(cats.length, 1)
  const categoryMinSpan = Math.max(0.5, (1 / catCount) * 100 * 0.8)
  const minSpanFor = (dim: string) =>
    dim === valueZoomDim ? 2 : categoryMinSpan

  const makeSlider = (dim: string) =>
    dim === 'xAxisIndex'
      ? {
          type: 'slider' as const,
          [dim]: 0,
          filterMode: filterModeFor(dim),
          minSpan: minSpanFor(dim),
          brushSelect: false,
          bottom: 8,
          height: 16,
          left: 8,
          right: showVSlider ? 30 : 8,
        }
      : {
          type: 'slider' as const,
          [dim]: 0,
          filterMode: filterModeFor(dim),
          minSpan: minSpanFor(dim),
          width: 14,
          right: 8,
          top:
            legendShown && legendReserveSide(legendPosition) === 'top'
              ? 40
              : 16,
          bottom: showHSlider ? 34 : 16,
        }

  const insideDims = [
    ...(zoomCategory ? [categoryZoomDim] : []),
    ...(zoomValue && (!zoomCategory || !zoomSlider) ? [valueZoomDim] : []),
  ]

  const dataZoom = zoomDims.length
    ? [
        ...insideDims.map(dim => ({
          type: 'inside' as const,
          [dim]: 0,
          filterMode: filterModeFor(dim),
          minSpan: minSpanFor(dim),
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
        })),
        ...(zoomSlider ? zoomDims.map(makeSlider) : []),
      ]
    : undefined

  const brushDim = isHorizontal ? 'yAxisIndex' : 'xAxisIndex'
  const brushType = isHorizontal ? 'lineY' : 'lineX'
  const brushConfig = selectable
    ? {
        toolbox: {
          show: true,
          top: 0,
          right: 8,
          itemSize: 13,
          feature: { brush: { type: [brushType, 'clear'] } },
          iconStyle: { borderColor: subtleColor },
        },
        brush: {
          [brushDim]: 0,
          brushType,
          brushMode: 'single',
          throttleType: 'debounce',
          throttleDelay: 80,
          brushStyle: {
            borderWidth: 1,
            borderColor: lineColor,
            color: 'rgba(124, 58, 237, 0.12)',
          },
        },
      }
    : null

  const topLegendY = axisBreaks.length && axisBreakExpandable ? 12 : 0

  const valueNameWidth =
    !isHorizontal && valueAxisName
      ? Math.min(168, Math.ceil(valueAxisName.length * 6.5) + 14)
      : 0

  const valuePlacement = valueAxisName
    ? resolveAxisName(valueAxisNamePosition, {
        orientation: isHorizontal ? 'horizontal' : 'vertical',
        side: valueAxisPosition,
        inverse: valueCfg?.inverse,
        rotation: valueCfg?.orientation,
        nameWidth: valueNameWidth || undefined,
        labelExtent: isHorizontal ? 22 + (showHSlider ? 30 : 0) : 44,
      })
    : undefined

  const catPlacement = categoryAxisName
    ? resolveAxisName(categoryAxisNamePosition, {
        orientation: isHorizontal ? 'vertical' : 'horizontal',
        rotation: catCfg?.orientation,
        labelExtent: isHorizontal
          ? 56
          : 22 + (showHSlider ? 30 : 0) + (axisLabelRotate ? 12 : 0),
      })
    : undefined

  const reserveFor = (s: 'left' | 'right' | 'top' | 'bottom') =>
    [valuePlacement, catPlacement].reduce(
      (acc, item) =>
        item && item.reserveSide === s ? Math.max(acc, item.reserve) : acc,
      0
    )

  const applyName = <T extends { nameTextStyle?: Record<string, unknown> }>(
    axis: T,
    p: ReturnType<typeof resolveAxisName> | undefined
  ) =>
    p
      ? {
          ...axis,
          nameLocation: p.nameLocation,
          nameRotate: p.nameRotate,
          nameGap: p.nameGap,
          nameTextStyle: { ...axis.nameTextStyle, ...p.nameTextStyle },
        }
      : axis

  const valueAxisNamed = applyName(valueAxis, valuePlacement)
  const categoryAxisNamed = applyName(categoryAxis, catPlacement)

  const xAxisBase = isHorizontal ? valueAxisNamed : categoryAxisNamed
  const yAxisBase = isHorizontal ? categoryAxisNamed : valueAxisNamed
  const xAxisFinal = xAxisLabel
    ? { ...xAxisBase, axisLabel: { ...xAxisBase.axisLabel, ...xAxisLabel } }
    : xAxisBase

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    ...(brushConfig ?? {}),
    ...(dataZoom ? { dataZoom } : {}),
    legend: buildLegendOption({
      shown: legendShown,
      data: grouped
        ? (series as BarSeries[])
            .filter(item => !item.silent)
            .map(item =>
              item.legendIcon !== undefined
                ? { name: item.name, icon: item.legendIcon }
                : item.name
            )
        : undefined,
      position: legendPosition,
      icon: legendIcon,
      align: legendAlign,
      topOffset: topLegendY,
      colors: { label: labelColor, subtle: subtleColor, line: lineColor },
      style: legendStyle,
    }),
    grid: {
      left: Math.max(
        legendShown && legendReserveSide(legendPosition) === 'left' ? 96 : 8,
        valueNameWidth,
        reserveFor('left')
      ),
      right: Math.max(
        legendShown && legendReserveSide(legendPosition) === 'right' ? 96 : 0,
        referenceLine && !isHorizontal ? 72 : 0,
        isHorizontal && showValues ? 56 : 0,
        showVSlider ? 40 : 0,
        reserveFor('right'),
        8
      ),
      top: Math.max(
        legendShown && legendReserveSide(legendPosition) === 'top' ? 48 : 0,
        referenceLine && isHorizontal ? 30 : 0,
        selectable ? 26 : 0,
        markPoints.length && !isHorizontal ? 32 : 0,
        axisBreaks.length && axisBreakExpandable ? 44 : 0,
        !isHorizontal && valueAxisName ? 24 : 0,
        reserveFor('top'),
        showValues && !isHorizontal ? 28 : 12
      ),
      bottom: Math.max(
        legendShown && legendReserveSide(legendPosition) === 'bottom' ? 48 : 0,
        (showHSlider ? 26 : 0) + (axisLabelRotate ? 34 : showHSlider ? 16 : 8),
        reserveFor('bottom'),
        8
      ),
      containLabel: true,
    },
    tooltip: {
      show: showTooltip,
      trigger: tooltipTrigger,
      axisPointer:
        tooltipTrigger === 'axis'
          ? {
              type: highlightOnHover ? ('none' as const) : ('shadow' as const),
              triggerEmphasis: false,
              shadowStyle: { color: 'rgba(127, 127, 127, 0.12)' },
              label: {
                show: axisPointerLabel,
                backgroundColor: surface,
                color: labelColor,
                borderColor: lineColor,
                borderWidth: 1,
                shadowBlur: 0,
                fontSize: 11,
              },
            }
          : undefined,
      backgroundColor: surface,
      borderColor: lineColor,
      borderWidth: 1,
      padding: tooltipTrigger === 'axis' ? [6, 10] : [4, 8],
      textStyle: { color: labelColor, fontSize: 11 },
      extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      formatter:
        tooltipTrigger === 'axis'
          ? (
              params: Array<{
                name?: string
                seriesName?: string
                value: number
                marker?: string
              }>
            ) => {
              const arr = Array.isArray(params) ? params : [params]
              const head = arr[0]?.name ?? ''
              const rows = arr
                .map(
                  item =>
                    `${item.marker ?? ''}${item.seriesName}: ${valueFormat(item.value)}`
                )
                .join('<br/>')
              return `${head}<br/>${rows}`
            }
          : (
              p:
                | { name: string; value: number; seriesName?: string }
                | { name: string; value: number; seriesName?: string }[]
            ) => {
              const item = Array.isArray(p) ? p[0] : p
              const head =
                grouped && item.seriesName
                  ? `${item.name} · ${item.seriesName}`
                  : item.name
              return `${head}: ${valueFormat(item.value)}`
            },
    },
    xAxis: xAxisFinal,
    yAxis: yAxisBase,
    series: seriesList,
  }
}
