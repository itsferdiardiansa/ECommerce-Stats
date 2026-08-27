import type { EChartsCoreOption } from 'echarts/core'
import {
  readCssColor,
  resolveVariant,
  resolveCategoricalPalette,
  prefersReducedMotion,
  resolveAxisName,
  buildLegendOption,
  legendReserveSide,
  buildItemHighlight,
  withAlpha,
} from '@/components/charts/utils'
import type {
  LegendPosition,
  LegendIcon,
  LegendAlign,
  LegendStyleOverrides,
} from '@/components/charts/utils'
import type {
  ScatterSeries,
  ScatterPalette,
  ScatterXAxis,
  ScatterYAxis,
  ScatterGrid,
  ScatterStep,
  ScatterAggregate,
  ScatterView,
} from './types'

export interface BuildScatterOptionParams {
  series: ScatterSeries[]
  title?: string
  subtitle?: string
  showCrosshair?: boolean
  palette: ScatterPalette
  symbolSize: number
  xAxis?: ScatterXAxis
  yAxis?: ScatterYAxis
  columns: number
  width: number
  gridLines: boolean
  showTooltip: boolean
  showLegend?: boolean
  legendPosition: LegendPosition
  legendIcon?: LegendIcon
  legendAlign?: LegendAlign
  legendStyle?: LegendStyleOverrides
  highlightOnHover: boolean
  formatValue: (value: number) => string
  animate: boolean
  emptyMessage: string
  steps?: ScatterStep[]
  autoPlay: boolean
  playInterval: number
  aggregate?: ScatterAggregate
  view?: ScatterView
  transitionDuration?: number
}

const PANEL_PX = 260
const PANEL_GAP_Y_PX = 56
const PANEL_TOP_TITLE_PX = 44
const PANEL_TOP_PX = 16
const PANEL_BOTTOM_PX = 28
const PANEL_MOBILE_BREAKPOINT = 640
const PANEL_OUTER_X = 6
const PANEL_GAP_X = 9

export function panelCountOf(series: ScatterSeries[]): number {
  const indices = series
    .map(item => item.gridIndex)
    .filter((item): item is number => item !== undefined)
  return indices.length ? Math.max(...indices) + 1 : 0
}

export function computePanelLayout(
  panelCount: number,
  columns: number,
  width: number,
  hasTitle: boolean
): { grids: ScatterGrid[]; height: number } {
  const effCols =
    width > 0 && width < PANEL_MOBILE_BREAKPOINT ? 1 : Math.max(1, columns)
  const rows = Math.ceil(panelCount / effCols)
  const topPx = hasTitle ? PANEL_TOP_TITLE_PX : PANEL_TOP_PX
  const height =
    topPx + rows * PANEL_PX + (rows - 1) * PANEL_GAP_Y_PX + PANEL_BOTTOM_PX
  const panelW =
    (100 - 2 * PANEL_OUTER_X - (effCols - 1) * PANEL_GAP_X) / effCols
  const grids = Array.from({ length: panelCount }, (_, p) => {
    const col = p % effCols
    const row = Math.floor(p / effCols)
    const top = topPx + row * (PANEL_PX + PANEL_GAP_Y_PX)
    return {
      left: `${PANEL_OUTER_X + col * (panelW + PANEL_GAP_X)}%`,
      top: `${(top / height) * 100}%`,
      width: `${panelW}%`,
      height: `${(PANEL_PX / height) * 100}%`,
    }
  })
  return { grids, height }
}

function scatterColors() {
  return {
    labelColor: readCssColor('--text-color-ds-default', 'rgb(23, 23, 23)'),
    subtleColor: readCssColor('--text-color-ds-subtle', 'rgb(82, 82, 82)'),
    lineColor: readCssColor('--border-color-ds-default', 'rgb(229, 229, 229)'),
    surface: readCssColor(
      '--background-color-ds-elevation-surface-raised',
      'rgb(255, 255, 255)'
    ),
  }
}

function buildTimelineOption(params: BuildScatterOptionParams) {
  const {
    steps = [],
    title,
    symbolSize,
    xAxis,
    yAxis,
    gridLines,
    showTooltip,
    highlightOnHover,
    formatValue,
    animate,
    autoPlay,
    playInterval,
  } = params

  const { labelColor, subtleColor, lineColor, surface } = scatterColors()
  const categorical = resolveCategoricalPalette()
  // The base cluster (index 0) stays neutral like the reference's grey, but
  // sourced from the chart neutral token; every split cluster picks up the
  // categorical palette so the whole thing is design-token driven.
  const clusterColor = (clusterIndex: number) =>
    clusterIndex === 0
      ? resolveVariant('neutral')
      : categorical[(clusterIndex - 1) % categorical.length]

  const axisLabelStyle = { color: subtleColor, fontSize: 11 }
  const splitLine = {
    show: gridLines,
    lineStyle: { color: lineColor, type: 'dashed' as const },
  }

  const baseAxis = (axis: ScatterXAxis | ScatterYAxis | undefined) => ({
    type: 'value' as const,
    scale: true,
    name: axis?.name,
    nameTextStyle: { color: labelColor },
    axisLabel: { ...axisLabelStyle, formatter: axis?.format ?? formatValue },
    axisLine: { lineStyle: { color: lineColor } },
    splitLine,
  })

  const renderBoundary = (
    _params: unknown,
    api: {
      coord: (v: number[]) => number[]
      size: (v: number[]) => number[]
      value: (i: number) => number
    }
  ) => {
    const center = api.coord([api.value(0), api.value(1)])
    const size = api.size([api.value(2), api.value(2)])
    return {
      type: 'ellipse' as const,
      shape: { cx: center[0], cy: center[1], rx: size[0], ry: size[1] },
      style: {
        fill: 'transparent',
        stroke: withAlpha(lineColor, 0.6),
        lineDash: [4, 4],
        lineWidth: 2,
      },
    }
  }

  // Every frame must expose the same series structure, otherwise ECharts'
  // timeline merges by index and leftover series from a later step linger
  // when the timeline loops back (so step 0 wouldn't match its initial
  // render). Pad the scatter series to the max any step needs, then always
  // append one boundary series (empty when that step has no boundary).
  const maxSeries = steps.reduce(
    (acc, step) => Math.max(acc, step.series.length),
    0
  )

  const frames = steps.map(step => ({
    series: [
      ...Array.from({ length: maxSeries }, (_, index) => {
        const s = step.series[index]
        const color = s?.color ?? clusterColor(index)
        return {
          name: s?.name ?? `Cluster ${index + 1}`,
          type: 'scatter' as const,
          data: s?.data ?? [],
          symbolSize: s?.symbolSize ?? symbolSize,
          itemStyle: { color, borderColor: subtleColor, borderWidth: 1 },
          ...buildItemHighlight(color, highlightOnHover),
        }
      }),
      {
        type: 'custom' as const,
        silent: true,
        renderItem: renderBoundary,
        data: step.boundary
          ? [
              [
                step.boundary.center[0],
                step.boundary.center[1],
                step.boundary.radius,
              ],
            ]
          : [],
      },
    ],
  }))

  return {
    timeline: {
      orient: 'vertical' as const,
      right: 40,
      top: title ? 44 : 20,
      bottom: 20,
      width: 8,
      inverse: true,
      autoPlay,
      playInterval,
      symbol: 'none' as const,
      label: {
        position: 12,
        formatter: (index: number) => steps[index]?.label ?? `step ${index}`,
        color: subtleColor,
      },
      lineStyle: { color: lineColor },
      checkpointStyle: { color: resolveVariant('primary') },
      controlStyle: { color: subtleColor, borderColor: lineColor },
      emphasis: {
        controlStyle: { color: labelColor, borderColor: labelColor },
      },
      data: steps.map((_, index) => index),
    },
    baseOption: {
      animation: animate && !prefersReducedMotion(),
      animationDurationUpdate: 700,
      ...(title
        ? {
            title: {
              text: title,
              left: 'center' as const,
              top: 0,
              textStyle: { color: labelColor },
            },
          }
        : {}),
      grid: {
        left: 12,
        right: 76,
        top: title ? 40 : 12,
        bottom: 24,
        containLabel: true,
      },
      xAxis: baseAxis(xAxis),
      yAxis: baseAxis(yAxis),
      tooltip: {
        show: showTooltip,
        trigger: 'item' as const,
        backgroundColor: surface,
        borderColor: lineColor,
        borderWidth: 1,
        padding: [4, 8] as [number, number],
        textStyle: { color: labelColor, fontSize: 11 },
        extraCssText:
          'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
        formatter: (p: { seriesName: string; value: [number, number] }) =>
          `${p.seriesName}<br/>(${formatValue(p.value[0])}, ${formatValue(p.value[1])})`,
      },
    },
    options: frames,
  } as EChartsCoreOption
}

export function buildScatterOption(params: BuildScatterOptionParams) {
  const {
    series,
    title,
    subtitle,
    showCrosshair,
    palette,
    symbolSize,
    xAxis,
    yAxis,
    columns,
    width,
    gridLines,
    showTooltip,
    showLegend,
    legendPosition,
    legendIcon,
    legendAlign,
    legendStyle,
    highlightOnHover,
    aggregate,
    view,
    transitionDuration = 1000,
    formatValue,
    animate,
    emptyMessage,
    steps,
  } = params

  if (steps && steps.length > 0) return buildTimelineOption(params)

  const { labelColor, subtleColor, lineColor, surface } = scatterColors()

  const hasData = series.some(item => item.data.length > 0)
  if (!hasData) {
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
  const panelCount = panelCountOf(series)
  const multiGrid = panelCount > 0
  const panelGrids = multiGrid
    ? computePanelLayout(panelCount, columns, width, Boolean(title)).grids
    : []
  const legendShown = showLegend ?? (!multiGrid && series.length > 1)

  const colorFor = (s: ScatterSeries, index: number) =>
    s.color ??
    (s.variant
      ? resolveVariant(s.variant)
      : palette === 'brand'
        ? resolveVariant('primary')
        : categorical[index % categorical.length])

  const axisIndex = (s: ScatterSeries) =>
    multiGrid
      ? { xAxisIndex: s.gridIndex ?? 0, yAxisIndex: s.gridIndex ?? 0 }
      : {}

  const seriesList = series.map((item, index) => {
    const color = colorFor(item, index)

    return {
      name: item.name,
      type: 'scatter' as const,
      data: item.data,
      symbolSize: item.symbolSize ?? symbolSize,
      itemStyle: { color },
      ...axisIndex(item),
      ...(aggregate
        ? {
            id: item.name,
            dataGroupId: item.name,
            universalTransition: { enabled: true },
          }
        : {}),
      ...buildItemHighlight(color, highlightOnHover),
      ...(item.trendLine
        ? {
            markLine: {
              animation: false,
              symbol: 'none',
              lineStyle: { type: 'solid' as const, color, width: 1.5 },
              emphasis: { lineStyle: { color, width: 3 } },
              blur: { lineStyle: { color, opacity: 1 } },
              label: {
                formatter: item.trendLine.label ?? '',
                align: 'right' as const,
                color: labelColor,
              },
              tooltip: { formatter: item.trendLine.label ?? '' },
              data: [
                [
                  { coord: item.trendLine.from, symbol: 'none' },
                  { coord: item.trendLine.to, symbol: 'none' },
                ],
              ],
            },
          }
        : {}),
    }
  })

  const regressionList = series.flatMap((item, index) => {
    if (!item.regression) return []
    const color = colorFor(item, index)
    return [
      {
        name: `${item.name} (fit)`,
        type: 'line' as const,
        data: item.regression.points,
        smooth: item.regression.smooth ?? true,
        symbol: 'none' as const,
        z: 3,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        emphasis: { disabled: true },
        blur: { lineStyle: { color, opacity: 1 } },
        ...axisIndex(item),
        ...(item.regression.label
          ? {
              endLabel: {
                show: true,
                formatter: item.regression.label,
                align: 'right' as const,
                color: labelColor,
                fontSize: 14,
              },
            }
          : {}),
      },
    ]
  })

  const xPlacement = resolveAxisName(xAxis?.position ?? 'middle', {
    orientation: xAxis?.orientation ?? 'horizontal',
    labelExtent: 22,
  })
  const yPlacement = resolveAxisName(yAxis?.position ?? 'middle', {
    orientation: yAxis?.orientation ?? 'vertical',
    side: yAxis?.side ?? 'left',
    labelExtent: 32,
  })

  const reserve = (side: 'left' | 'right' | 'top' | 'bottom') => {
    let total = 0
    if (xAxis?.name && xPlacement.reserveSide === side)
      total += xPlacement.reserve
    if (yAxis?.name && yPlacement.reserveSide === side)
      total += yPlacement.reserve
    return total
  }

  const axisLabelStyle = { color: subtleColor, fontSize: 11 }
  const splitLine = {
    show: gridLines,
    lineStyle: { color: lineColor, type: 'dashed' as const },
  }

  const makeXAxis = (gridIndex?: number) => ({
    type: 'value' as const,
    ...(gridIndex !== undefined ? { gridIndex } : {}),
    min: xAxis?.min,
    max: xAxis?.max,
    scale: true,
    name: xAxis?.name,
    nameLocation: xPlacement.nameLocation,
    nameRotate: xPlacement.nameRotate,
    nameGap: xPlacement.nameGap,
    nameTextStyle: { color: labelColor, ...xPlacement.nameTextStyle },
    axisLabel: { ...axisLabelStyle, formatter: xAxis?.format ?? formatValue },
    axisLine: { lineStyle: { color: lineColor } },
    splitLine,
  })

  const makeYAxis = (gridIndex?: number) => ({
    type: 'value' as const,
    ...(gridIndex !== undefined ? { gridIndex } : {}),
    min: yAxis?.min,
    max: yAxis?.max,
    scale: true,
    name: yAxis?.name,
    nameLocation: yPlacement.nameLocation,
    nameRotate: yPlacement.nameRotate,
    nameGap: yPlacement.nameGap,
    nameTextStyle: { color: labelColor, ...yPlacement.nameTextStyle },
    axisLabel: { ...axisLabelStyle, formatter: yAxis?.format ?? formatValue },
    axisLine: { lineStyle: { color: lineColor } },
    splitLine,
  })

  const titleReserve = title ? (subtitle ? 46 : 28) : 0

  const singleGrid = {
    left:
      (legendShown && legendReserveSide(legendPosition) === 'left' ? 96 : 12) +
      reserve('left'),
    right:
      (legendShown && legendReserveSide(legendPosition) === 'right' ? 96 : 12) +
      reserve('right'),
    top:
      (legendShown && legendReserveSide(legendPosition) === 'top' ? 52 : 12) +
      titleReserve +
      reserve('top'),
    bottom:
      (legendShown && legendReserveSide(legendPosition) === 'bottom'
        ? 52
        : 12) + reserve('bottom'),
    containLabel: true,
  }

  const titleOption = title
    ? {
        title: {
          text: title,
          ...(subtitle ? { subtext: subtitle } : {}),
          left: 'center' as const,
          top: 0,
          textStyle: { color: labelColor },
          subtextStyle: { color: subtleColor },
        },
      }
    : {}

  const legend = buildLegendOption({
    shown: legendShown,
    data: series.map(item => item.name),
    position: legendPosition,
    icon: legendIcon,
    align: legendAlign,
    topOffset: legendReserveSide(legendPosition) === 'top' ? titleReserve : 0,
    colors: { label: labelColor, subtle: subtleColor, line: lineColor },
    style: legendStyle,
  })

  // Bar view of the same data: one bar series per group, named/id-matched to
  // its scatter series so (a) `universalTransition` morphs each cloud of
  // points into exactly its own bar and (b) the legend keeps per-group names,
  // colors, and show/hide. Each series only has a value at its own category,
  // and they overlap (`barGap: -100%`) so every group's single bar sits
  // centered in its category. Reuses `singleGrid`/`legend` so the plot
  // rectangle doesn't jump on morph.
  if (aggregate && view === 'bar') {
    const dim = aggregate.dimension ?? 0
    const barFormat = aggregate.formatValue ?? formatValue
    const categories = series.map(item => item.name)
    const barSeries = series.map((item, index) => {
      const avg = item.data.length
        ? item.data.reduce((sum, item) => sum + item[dim], 0) / item.data.length
        : 0
      return {
        type: 'bar' as const,
        id: item.name,
        name: item.name,
        barGap: '-100%',
        barCategoryGap: '40%',
        barMaxWidth: 80,
        itemStyle: { color: colorFor(item, index), borderRadius: [4, 4, 0, 0] },
        label: {
          show: true,
          position: 'top' as const,
          color: labelColor,
          formatter: (p: { value: number | string }) =>
            typeof p.value === 'number' ? barFormat(p.value) : '',
        },
        // Value only at its own category; tagged with the same groupId the
        // scatter series carries so its points morph into this one bar.
        data: categories.map(category =>
          category === item.name ? { value: avg, groupId: item.name } : '-'
        ),
        universalTransition: { enabled: true },
      }
    })

    return {
      animation: animate && !prefersReducedMotion(),
      animationDurationUpdate: transitionDuration,
      ...titleOption,
      legend,
      grid: singleGrid,
      xAxis: {
        type: 'category' as const,
        data: categories,
        axisLabel: axisLabelStyle,
        axisLine: { lineStyle: { color: lineColor } },
      },
      yAxis: {
        type: 'value' as const,
        scale: true,
        axisLabel: { ...axisLabelStyle, formatter: barFormat },
        axisLine: { lineStyle: { color: lineColor } },
        splitLine,
      },
      tooltip: {
        show: showTooltip,
        trigger: 'item' as const,
        backgroundColor: surface,
        borderColor: lineColor,
        borderWidth: 1,
        padding: [4, 8] as [number, number],
        textStyle: { color: labelColor, fontSize: 11 },
        extraCssText:
          'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      },
      series: barSeries,
    } as EChartsCoreOption
  }

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationDurationUpdate: transitionDuration,
    animationEasing: 'cubicOut' as const,
    ...titleOption,
    legend,
    grid: multiGrid ? panelGrids : singleGrid,
    xAxis: multiGrid
      ? panelGrids.map((_, index) => makeXAxis(index))
      : makeXAxis(),
    yAxis: multiGrid
      ? panelGrids.map((_, index) => makeYAxis(index))
      : makeYAxis(),
    tooltip: {
      show: showTooltip,
      trigger: 'item' as const,
      ...(showCrosshair
        ? {
            axisPointer: {
              type: 'cross' as const,
              crossStyle: { color: subtleColor, type: 'dashed' as const },
              lineStyle: { color: subtleColor, type: 'dashed' as const },
              label: {
                backgroundColor: surface,
                color: labelColor,
                borderColor: lineColor,
                borderWidth: 1,
                shadowBlur: 0,
                fontSize: 11,
              },
            },
          }
        : {}),
      backgroundColor: surface,
      borderColor: lineColor,
      borderWidth: 1,
      padding: [4, 8] as [number, number],
      textStyle: { color: labelColor, fontSize: 11 },
      extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      formatter: (p: { seriesName: string; value: [number, number] }) =>
        `${p.seriesName}<br/>(${formatValue(p.value[0])}, ${formatValue(p.value[1])})`,
    },
    series: [...seriesList, ...regressionList],
  }
}
