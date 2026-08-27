'use client'

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import type {
  EChartEventParams,
  EChartEvents,
  EChartBuildContext,
} from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildPieOption } from './buildOption'
import { styles } from './styles'
import type { PieProps, PieDatum } from './types'
import { PieDetailPanel } from './PieDetailPanel'

const COMPACT_WIDTH = 680
const EMPTY_DATA: PieDatum[] = []
const defaultFormatValue = (value: number) => String(value)

export type {
  PieProps,
  PieDatum,
  PieDetail,
  PieDetailRow,
  PieCustomLabel,
  PieSeries,
  PiePalette,
  PieGeo,
  PieCalendar,
  PieRoseType,
  PieLabelPosition,
  PieLabelAlignTo,
  PieLabelDatum,
} from './types'

echarts.use([
  PieChart,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
])

function resolveDatum(
  params: EChartEventParams,
  data: PieDatum[]
): [PieDatum, number] {
  const name = params.name ?? ''
  const index = data.findIndex(item => item.label === name)
  if (index >= 0) return [data[index], index]
  const value = typeof params.value === 'number' ? params.value : 0
  return [{ label: name, value }, params.dataIndex ?? -1]
}

export const Pie: React.FC<PieProps> = ({
  data = EMPTY_DATA,
  series,
  height = 360,
  innerRadius,
  outerRadius,
  center,
  geo,
  calendar,
  startAngle = 90,
  endAngle,
  padAngle = 0,
  borderRadius = 0,
  roseType = false,
  palette = 'categorical',
  showLabels = true,
  labelOnHover = false,
  labelOnClick = false,
  labelPosition = 'outside',
  labelAlignTo = 'none',
  showLabelLine = true,
  labelFormatter,
  showTooltip = true,
  showLegend,
  legendPosition = 'bottom',
  legendIcon = 'circle',
  legendAlign,
  legendStyle,
  scrollableLegend = false,
  highlightOnHover = false,
  selectedMode = false,
  formatValue = defaultFormatValue,
  loading = false,
  loadingVariant,
  loadingSize,
  loadingColor,
  loadingMask,
  animate = true,
  emptyMessage = 'No data',
  compact,
  stackDetailBelow = 520,
  onSliceClick,
  onReady,
  className,
  style,
}) => {
  const instanceRef = useRef<ECharts | null>(null)
  const [revealedIndex, setRevealedIndex] = useState<{
    seriesIndex: number
    dataIndex: number
  } | null>(null)
  const revealedRef = useRef(revealedIndex)
  useEffect(() => {
    revealedRef.current = revealedIndex
  }, [revealedIndex])

  const buildOption = useCallback(
    (ctx: EChartBuildContext) =>
      buildPieOption({
        data,
        series,
        innerRadius,
        outerRadius,
        center,
        geo,
        calendar,
        startAngle,
        endAngle,
        padAngle,
        borderRadius,
        roseType,
        palette,
        showLabels,
        labelOnHover,
        labelOnClick,
        labelPosition,
        labelAlignTo,
        showLabelLine,
        labelFormatter,
        showTooltip,
        showLegend,
        legendPosition,
        legendIcon,
        legendAlign,
        legendStyle,
        scrollableLegend,
        highlightOnHover,
        selectedMode,
        formatValue,
        animate,
        emptyMessage,
        compact: compact ?? ctx.compact,
        stacked: ctx.stacked,
        width: ctx.width,
        height: ctx.height,
        revealedIndex: revealedRef.current,
      }),
    [
      data,
      series,
      innerRadius,
      outerRadius,
      center,
      geo,
      calendar,
      startAngle,
      endAngle,
      padAngle,
      borderRadius,
      roseType,
      palette,
      showLabels,
      labelOnHover,
      labelOnClick,
      labelPosition,
      labelAlignTo,
      showLabelLine,
      labelFormatter,
      showTooltip,
      showLegend,
      legendPosition,
      legendIcon,
      legendAlign,
      legendStyle,
      scrollableLegend,
      highlightOnHover,
      selectedMode,
      formatValue,
      animate,
      emptyMessage,
      compact,
    ]
  )

  const allData = useMemo<PieDatum[]>(
    () => (series?.length ? series.flatMap(item => item.data) : data),
    [series, data]
  )

  const cardItems = useMemo(
    () => allData.filter(item => item.detail || item.richLabel),
    [allData]
  )

  const unselectAllBut = useCallback(
    (chart: ECharts, keepSeries: number | null) => {
      const option = chart.getOption() as { series?: { data?: unknown[] }[] }
      ;(option.series ?? []).forEach((item, seriesIndex) => {
        if (seriesIndex === keepSeries) return
        const length = Array.isArray(item.data) ? item.data.length : 0
        if (length > 0)
          chart.dispatchAction({
            type: 'unselect',
            seriesIndex,
            dataIndex: Array.from({ length }, (_, index) => index),
          })
      })
    },
    []
  )

  const events = useMemo<EChartEvents>(
    () => ({
      click: params => {
        if (labelOnClick && instanceRef.current) {
          const seriesIndex = params.seriesIndex ?? 0
          const dataIndex = params.dataIndex ?? 0
          setRevealedIndex(prev =>
            prev &&
            prev.seriesIndex === seriesIndex &&
            prev.dataIndex === dataIndex
              ? null
              : { seriesIndex, dataIndex }
          )
          unselectAllBut(instanceRef.current, seriesIndex)
        }
        const [datum, index] = resolveDatum(params, allData)
        onSliceClick?.(datum, index)
      },
    }),
    [allData, onSliceClick, labelOnClick, unselectAllBut]
  )

  const {
    containerRef,
    stacked,
    compact: autoCompact,
    width: chartWidth,
  } = useEChart({
    buildOption,
    events,
    onReady: chart => {
      instanceRef.current = chart
      onReady?.(chart)
    },
    compactBelow: compact === undefined ? COMPACT_WIDTH : undefined,
    stackBelow:
      cardItems.length > 0 && stackDetailBelow !== false
        ? stackDetailBelow
        : undefined,
    rebuildOnResize: Boolean(
      calendar || legendPosition === 'left' || legendPosition === 'right'
    ),
  })

  useEffect(() => {
    if (!labelOnClick) return
    instanceRef.current?.setOption(
      buildOption({
        compact: autoCompact,
        stacked,
        width: chartWidth,
        height: 0,
      })
    )
  }, [
    revealedIndex,
    labelOnClick,
    buildOption,
    autoCompact,
    stacked,
    chartWidth,
  ])

  useEffect(() => {
    if (!labelOnClick) return
    const chart = instanceRef.current
    if (!chart) return
    const zr = chart.getZr()
    const onEmptyClick = (event: { target?: unknown }) => {
      if (!event.target) {
        setRevealedIndex(null)
        unselectAllBut(chart, null)
      }
    }
    zr.on('click', onEmptyClick)
    return () => {
      zr.off('click', onEmptyClick)
    }
  }, [labelOnClick, unselectAllBut])

  return (
    <div className={cn(styles.root, className)} style={style}>
      <div
        role="img"
        aria-label="Pie chart"
        data-testid="pie-chart"
        className={styles.root}
        style={{
          position: 'relative',
          height: typeof height === 'number' ? `${height}px` : height,
        }}
      >
        <div ref={containerRef} style={CHART_SURFACE} />
        <ChartLoading
          show={loading}
          variant={loadingVariant}
          size={loadingSize}
          color={loadingColor}
          mask={loadingMask}
        />
      </div>
      {stacked && cardItems.length > 0 ? (
        <PieDetailPanel items={cardItems} formatValue={formatValue} />
      ) : null}
    </div>
  )
}

Pie.displayName = 'Pie'
