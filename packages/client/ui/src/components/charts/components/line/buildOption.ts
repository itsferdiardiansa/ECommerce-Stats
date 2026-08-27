import {
  readCssColor,
  lighten,
  resolveVariant,
  resolveVariantOrColor,
  resolveCategoricalPalette,
  prefersReducedMotion,
  withAlpha,
  buildLegendOption,
  legendReserveSide,
  buildLineHighlight,
} from '@/components/charts/utils'
import { resolveAxisName } from '@/components/charts/utils'
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
import { gradientFill, curveProps, toArray, valueOf } from './helpers'
import type {
  LineSeries,
  LinePalette,
  LineCurve,
  LineXAxisType,
  LineMarkPoint,
  LineReferenceLine,
  LineMarkArea,
  LineThreshold,
  LineYAxis,
  LineXAxis,
} from './types'

export interface BuildLineOptionParams {
  categories?: (string | number)[]
  series: LineSeries[]
  xAxisType: LineXAxisType
  curve: LineCurve
  area?: boolean | 'gradient'
  palette: LinePalette
  showSymbol: boolean
  symbolSize: number
  lineWidth: number
  connectNulls: boolean
  min?: number
  max?: number
  showValueAxis: boolean
  gridLines?: boolean
  yAxes?: LineYAxis[]
  xAxis?: LineXAxis
  axisLabelRotate: number
  xAxisLabel?: AxisLabelOverride
  showTooltip: boolean
  tooltipTrigger: 'item' | 'axis'
  showLegend?: boolean
  legendPosition: LegendPosition
  legendIcon?: LegendIcon
  legendAlign?: LegendAlign
  legendStyle?: LegendStyleOverrides
  highlightOnHover: boolean
  threshold?: LineThreshold
  referenceLine?: LineReferenceLine | LineReferenceLine[]
  markArea?: LineMarkArea | LineMarkArea[]
  markPoints: LineMarkPoint[]
  zoom: boolean
  zoomSlider: boolean
  zoomWindow?: [number, number]
  toolbox: boolean
  sparkline: boolean
  formatValue: (value: number) => string
  formatX?: (value: string | number) => string
  animate: boolean
  emptyMessage: string
}

export function buildLineOption(params: BuildLineOptionParams) {
  const {
    categories,
    series,
    xAxisType,
    curve,
    area,
    palette,
    showSymbol,
    symbolSize,
    lineWidth,
    connectNulls,
    min,
    max,
    showValueAxis,
    gridLines,
    yAxes,
    xAxis,
    axisLabelRotate,
    xAxisLabel,
    showTooltip,
    tooltipTrigger,
    showLegend,
    legendPosition,
    legendIcon,
    legendAlign,
    legendStyle,
    highlightOnHover,
    threshold,
    referenceLine,
    markArea,
    markPoints,
    zoom,
    zoomSlider,
    zoomWindow,
    toolbox,
    sparkline,
    formatValue,
    formatX,
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
  const inverseColor = readCssColor(
    '--text-color-ds-inverse',
    'rgb(250, 250, 250)'
  )

  const maxLen = series.reduce(
    (acc, item) => Math.max(acc, item.data.length),
    0
  )

  if (!series.length || maxLen === 0) {
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

  const cats =
    xAxisType === 'category'
      ? categories?.length
        ? categories
        : Array.from({ length: maxLen }, (_, index) => index)
      : undefined

  const categorical = resolveCategoricalPalette()
  const fmtX = formatX ?? ((value: string | number) => String(value))

  const colorFor = (s: LineSeries, index: number): string =>
    s.color ??
    (s.variant
      ? resolveVariant(s.variant)
      : palette === 'brand'
        ? resolveVariant('primary')
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
        format: yAx.format ?? formatValue,
      }))
    : [
        {
          key: 'left',
          name: undefined,
          side: 'left',
          position: 'top',
          orientation: undefined,
          min,
          max,
          inverse: false,
          format: formatValue,
        },
      ]

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

  const fmtFor = (name?: string) => {
    const s = series.find(item => item.name === name)
    return axes[seriesAxisIndex(s?.yAxis)]?.format ?? formatValue
  }

  const multi = series.length > 1
  const anyGradient = series.some(item => (item.area ?? area) === 'gradient')
  const legendShown = !sparkline && (showLegend ?? multi)

  const seriesList = series.map((item, index) => {
    const color = seriesColors[index]
    const hover = lighten(color)
    const areaMode = item.area ?? area
    const symbolOn = item.showSymbol ?? showSymbol
    const width = item.width ?? lineWidth

    const isThreshold = Boolean(threshold) && index === 0
    const shape = isThreshold
      ? { smooth: false as const }
      : curveProps(item.curve ?? curve)

    const isGradient = areaMode === 'gradient'
    const fill = areaMode
      ? isGradient
        ? { color: gradientFill(color), opacity: 1 }
        : { color, opacity: 0.15 }
      : undefined

    const annotations = index === 0 ? buildAnnotations() : {}

    return {
      name: item.name,
      type: 'line' as const,
      data: item.data,
      stack: item.stack,
      yAxisIndex: seriesAxisIndex(item.yAxis),
      ...shape,
      connectNulls,
      showSymbol: symbolOn,
      symbol: 'circle' as const,
      symbolSize,
      ...(item.data.length > 200 && !isThreshold
        ? { sampling: 'lttb' as const }
        : {}),
      lineStyle: {
        color,
        width,
        type: item.dashed ? ('dashed' as const) : ('solid' as const),
      },
      itemStyle: { color, borderColor: surface, borderWidth: 1.5 },
      ...buildLineHighlight(color, {
        width,
        enabled: highlightOnHover,
        disabled: isThreshold,
        area: fill
          ? {
              emphasis: isGradient ? fill : { color: hover, opacity: 0.25 },
              blurOpacity: 0.06,
            }
          : undefined,
      }),
      ...(fill ? { areaStyle: fill } : {}),
      ...annotations,
    }
  })

  function buildAnnotations() {
    const refs = toArray(referenceLine)
    const areas = toArray(markArea)

    const markLine = refs.length
      ? {
          silent: true,
          symbol: 'none' as const,
          data: refs.map(ref => ({
            [ref.axis === 'x' ? 'xAxis' : 'yAxis']: ref.value,
            lineStyle: {
              color: ref.color ?? subtleColor,
              type: 'dashed' as const,
              width: 1.5,
            },
            label: {
              show: Boolean(ref.label),
              position: 'insideEndTop' as const,
              color: ref.color ?? subtleColor,
              fontSize: 11,
              backgroundColor: surface,
              borderColor: lineColor,
              borderWidth: 1,
              borderRadius: 4,
              padding: [2, 6] as [number, number],
              formatter: () => ref.label ?? formatValue(ref.value),
            },
          })),
        }
      : undefined

    const markAreaOpt = areas.length
      ? {
          silent: true,
          data: areas.map(area => {
            const dim = (area.axis ?? 'x') === 'y' ? 'yAxis' : 'xAxis'
            return [
              {
                [dim]: area.from,
                itemStyle: { color: withAlpha(area.color ?? subtleColor, 0.1) },
                label: {
                  show: Boolean(area.label),
                  position: 'insideTop' as const,
                  color: subtleColor,
                  fontSize: 11,
                  formatter: () => area.label ?? '',
                },
              },
              { [dim]: area.to },
            ]
          }),
        }
      : undefined

    const markPointOpt = markPoints.length
      ? {
          symbol: 'pin' as const,
          symbolSize: 42,
          data: markPoints.map(type => ({ type })),
          itemStyle: { color: seriesColors[0] },
          emphasis: { disabled: true },
          label: {
            color: inverseColor,
            fontSize: 11,
            formatter: (p: { value: number | unknown[] }) =>
              formatValue(valueOf(p.value)),
          },
        }
      : undefined

    return {
      ...(markLine ? { markLine } : {}),
      ...(markAreaOpt ? { markArea: markAreaOpt } : {}),
      ...(markPointOpt ? { markPoint: markPointOpt } : {}),
    }
  }

  const visualMap = threshold
    ? (() => {
        const values = series[0].data.map(valueOf).filter(Number.isFinite)
        const dataMin = values.length ? Math.min(...values) : threshold.value
        const dataMax = values.length ? Math.max(...values) : threshold.value
        const lo = Math.min(dataMin, threshold.value)
        const hi = Math.max(dataMax, threshold.value)
        return {
          show: false,
          type: 'piecewise' as const,
          seriesIndex: 0,
          min: lo,
          max: hi,
          pieces: [
            {
              gte: threshold.value,
              lte: hi,
              color:
                resolveVariantOrColor(threshold.above) ??
                resolveVariant('success'),
            },
            {
              gte: lo,
              lt: threshold.value,
              color:
                resolveVariantOrColor(threshold.below) ??
                resolveVariant('destructive'),
            },
          ],
        }
      })()
    : undefined

  const showGrid = !sparkline && (gridLines ?? showValueAxis)

  const willShowSlider = zoom && !sparkline && zoomSlider

  const placements = axes.map(ax =>
    !sparkline && ax.name
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

  const catName = xAxis?.name
  const catPosition = xAxis?.position ?? 'right'

  const catPlacement =
    !sparkline && catName
      ? resolveAxisName(catPosition, {
          orientation: 'horizontal',
          rotation: xAxis?.orientation,
          nameWidth: Math.ceil(catName.length * 6.5),
          labelExtent:
            22 + (willShowSlider ? 30 : 0) + (axisLabelRotate ? 12 : 0),
        })
      : undefined

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
      if (maxOff > 0) m = Math.max(m, maxOff + 44)
    }
    return m
  }

  const yAxisList = axes.map((ax, index) => {
    const p = placements[index]
    const nameStyle: Record<string, unknown> = p
      ? p.nameLocation === 'middle'
        ? p.nameTextStyle
        : ax.side === 'right'
          ? { align: 'right', padding: [0, -20, 0, 0] }
          : p.nameTextStyle
      : {}
    return {
      type: 'value' as const,
      position: ax.side,
      offset: axisOffset.get(ax.key) ?? 0,
      min: ax.min,
      max: ax.max,
      inverse: ax.inverse,
      scale: true,
      name: sparkline ? undefined : ax.name,
      ...(p
        ? {
            nameLocation: p.nameLocation,
            nameRotate: p.nameRotate,
            nameGap: p.nameGap,
          }
        : {}),
      nameTextStyle: { color: subtleColor, fontSize: 11, ...nameStyle },
      splitLine: {
        show: index === 0 && showGrid,
        lineStyle: { color: lineColor, type: 'dashed' as const },
      },
      axisLabel:
        sparkline || !showValueAxis
          ? { show: false }
          : {
              color: labelColor,
              fontSize: 12,
              formatter: (value: number) => ax.format(value),
            },
      axisTick: { show: false },
      axisLine: { show: false },
      axisPointer: {
        label: {
          backgroundColor: surface,
          color: labelColor,
          borderColor: lineColor,
          borderWidth: 1,
          shadowBlur: 0,
          fontSize: 11,
          formatter: (pt: { value: number }) => ax.format(Math.round(pt.value)),
        },
      },
    }
  })

  const yAxis = yAxisList.length === 1 ? yAxisList[0] : yAxisList

  const xAxisOption = {
    type: xAxisType,
    ...(xAxisType === 'category' ? { data: cats, boundaryGap: false } : {}),
    name: sparkline ? undefined : catName,
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
    axisLine: {
      show: !sparkline,
      lineStyle: { color: lineColor },
    },
    axisTick: { show: false },
    axisLabel: sparkline
      ? { show: false }
      : {
          color: labelColor,
          fontSize: 12,
          rotate: axisLabelRotate,
          hideOverlap: true,
          formatter:
            xAxisType === 'time' ? (value: number) => fmtX(value) : undefined,
          ...xAxisLabel,
        },
  }

  const minSpan = Math.min(100, Math.max(2, (4 / maxLen) * 100))

  const window = zoomWindow ? { start: zoomWindow[0], end: zoomWindow[1] } : {}

  const dataZoom =
    zoom && !sparkline
      ? [
          {
            type: 'inside' as const,
            xAxisIndex: 0,
            minSpan,
            ...window,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: false,
          },
          ...(zoomSlider
            ? [
                {
                  type: 'slider' as const,
                  xAxisIndex: 0,
                  minSpan,
                  ...window,
                  height: 18,
                  bottom: 8,
                  left: 8,
                  right: 8,
                  brushSelect: false,
                },
              ]
            : []),
        ]
      : undefined

  const toolboxOpt =
    toolbox && !sparkline
      ? {
          right: 12,
          top: 6,
          itemSize: 14,
          itemGap: 8,
          iconStyle: { borderColor: subtleColor },
          emphasis: { iconStyle: { borderColor: labelColor } },
          feature: {
            dataZoom: { yAxisIndex: 'none' as const },
            restore: {},
            saveAsImage: { backgroundColor: surface, pixelRatio: 2 },
          },
        }
      : undefined

  const showHSlider = Boolean(dataZoom && zoomSlider)

  const grid = sparkline
    ? { left: 2, right: 2, top: 2, bottom: 2, containLabel: false }
    : {
        left: Math.max(
          8,
          (legendShown && legendReserveSide(legendPosition) === 'left'
            ? 96
            : 0) + reserveFor('left')
        ),
        right: Math.max(
          12,
          (legendShown && legendReserveSide(legendPosition) === 'right'
            ? 96
            : 0) + reserveFor('right')
        ),
        top: Math.max(
          legendShown && legendReserveSide(legendPosition) === 'top' ? 44 : 0,
          reserveFor('top'),
          toolboxOpt ? 80 : 0,
          12
        ),
        bottom: Math.max(
          (legendShown && legendReserveSide(legendPosition) === 'bottom'
            ? 44
            : 0) + reserveFor('bottom'),
          showHSlider ? 36 : 0,
          axisLabelRotate ? 24 : 0,
          8
        ),
        containLabel: true,
      }

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    stateAnimation: {
      duration: anyGradient ? 0 : 300,
      easing: 'cubicOut' as const,
    },
    ...(visualMap ? { visualMap } : {}),
    ...(dataZoom ? { dataZoom } : {}),
    ...(toolboxOpt ? { toolbox: toolboxOpt } : {}),
    legend: buildLegendOption({
      shown: legendShown,
      data: series.map(item => item.name),
      position: legendPosition,
      icon: legendIcon,
      align: legendAlign,
      colors: { label: labelColor, subtle: subtleColor, line: lineColor },
      style: legendStyle,
    }),
    grid,
    tooltip: {
      show: showTooltip && !sparkline,
      trigger: tooltipTrigger,
      axisPointer:
        tooltipTrigger === 'axis'
          ? {
              type: 'cross' as const,
              triggerEmphasis: false,
              crossStyle: { color: subtleColor, type: 'dashed' as const },
              lineStyle: { color: subtleColor, type: 'dashed' as const },
              label: {
                backgroundColor: surface,
                color: labelColor,
                borderColor: lineColor,
                borderWidth: 1,
                shadowBlur: 0,
                fontSize: 11,
                formatter: (p: { axisDimension?: string; value: number }) =>
                  p.axisDimension === 'y'
                    ? formatValue(Math.round(p.value))
                    : fmtX(p.value),
              },
            }
          : undefined,
      backgroundColor: surface,
      borderColor: lineColor,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: labelColor, fontSize: 11 },
      extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      formatter:
        tooltipTrigger === 'axis'
          ? (
              args: Array<{
                axisValue?: string | number
                axisValueLabel?: string
                seriesName?: string
                value: number | unknown[]
                marker?: string
              }>
            ) => {
              const arr = Array.isArray(args) ? args : [args]
              const head = fmtX(
                arr[0]?.axisValue ?? arr[0]?.axisValueLabel ?? ''
              )
              const rows = arr
                .map(
                  item =>
                    `${item.marker ?? ''}${item.seriesName}: ${fmtFor(item.seriesName)(valueOf(item.value))}`
                )
                .join('<br/>')
              return `${head}<br/>${rows}`
            }
          : (p: {
              name?: string
              seriesName?: string
              value: number | unknown[]
              marker?: string
              data?: unknown
            }) => {
              const item = Array.isArray(p) ? p[0] : p
              const x = Array.isArray(item.value)
                ? fmtX(item.value[0] as string | number)
                : (item.name ?? '')
              const head =
                multi && item.seriesName ? `${x} · ${item.seriesName}` : x
              return `${item.marker ?? ''}${head}: ${fmtFor(item.seriesName)(valueOf(item.value))}`
            },
    },
    xAxis: xAxisOption,
    yAxis,
    series: seriesList,
  }
}
