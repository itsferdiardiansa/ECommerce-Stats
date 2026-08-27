'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import {
  BarChart as EBarChart,
  LineChart as ELineChart,
  PieChart as EPieChart,
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  AxisPointerComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import type { EChartEvents, EChartEventParams } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import {
  buildComboOption,
  summaryPieData,
  resolveSeriesColors,
  SUMMARY_PIE_ID,
} from './buildOption'
import { styles } from './styles'
import type { ComboProps, ComboSummaryPie } from './types'

export type {
  ComboProps,
  ComboSeries,
  ComboSeriesType,
  ComboYAxis,
  ComboXAxis,
  ComboSummaryPie,
} from './types'

echarts.use([
  EBarChart,
  ELineChart,
  EPieChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  AxisPointerComponent,
  CanvasRenderer,
])

export const Combo: React.FC<ComboProps> = ({
  categories,
  series,
  height = 320,
  showValues = false,
  showTooltip = true,
  showLegend = true,
  legendPosition = 'top',
  legendIcon,
  legendAlign,
  legendStyle,
  gridLines = true,
  highlightOnHover = false,
  barRadius = 4,
  axisLabelRotate = 0,
  yAxes,
  xAxis,
  xAxisLabel,
  summaryPie,
  loading = false,
  loadingVariant,
  loadingSize,
  loadingColor,
  loadingMask,
  animate = true,
  emptyMessage = 'No data',
  onReady,
  className,
  style,
}) => {
  const pie = useMemo<ComboSummaryPie | undefined>(
    () =>
      summaryPie === true ? {} : summaryPie === false ? undefined : summaryPie,
    [summaryPie]
  )

  const instanceRef = useRef<ECharts | null>(null)
  const overGridRef = useRef(false)
  const activeRef = useRef(pie?.activeIndex ?? categories.length - 1)

  const buildOption = useCallback(
    () =>
      buildComboOption({
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
        summaryPie: pie,
        activeIndex: activeRef.current,
        animate,
        emptyMessage,
      }),
    [
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
      pie,
      animate,
      emptyMessage,
    ]
  )

  const setActive = useCallback(
    (index: number) => {
      if (!pie) return
      if (!Number.isInteger(index)) return
      if (index === activeRef.current) return
      if (index < 0 || index >= categories.length) return
      activeRef.current = index
      instanceRef.current?.setOption({
        series: {
          id: SUMMARY_PIE_ID,
          data: summaryPieData(series, resolveSeriesColors(series), index),
        },
      })
      pie.onActiveIndexChange?.(index, categories[index])
    },
    [pie, series, categories]
  )

  const events = useMemo<EChartEvents>(() => {
    const none: EChartEvents = {}
    if (!pie) return none
    return {
      updateAxisPointer: (params: EChartEventParams) => {
        if (!overGridRef.current) return
        const info = params.axesInfo?.[0]
        if (!info || info.value === undefined) return
        setActive(Number(info.value))
      },
    }
  }, [pie, setActive])

  const { containerRef, chartRef } = useEChart({
    buildOption,
    events,
    onReady: chart => {
      instanceRef.current = chart
      onReady?.(chart)
    },
  })

  useEffect(() => {
    if (!pie) return
    const host = containerRef.current
    const chart = chartRef.current
    if (!host || !chart) return

    const track = (event: MouseEvent) => {
      const rect = host.getBoundingClientRect()
      overGridRef.current = Boolean(
        chart.containPixel({ gridIndex: 0 }, [
          event.clientX - rect.left,
          event.clientY - rect.top,
        ])
      )
    }
    const leave = () => {
      overGridRef.current = false
    }
    host.addEventListener('mousemove', track, true)
    host.addEventListener('mouseleave', leave, true)

    const link = (type: 'highlight' | 'downplay', name?: string) => {
      if (!name) return
      chart.dispatchAction({
        type,
        batch: [{ seriesName: name }, { seriesId: SUMMARY_PIE_ID, name }],
      })
    }

    const relay =
      (type: 'highlight' | 'downplay') =>
      (...args: unknown[]) => {
        const p = args[0] as {
          seriesName?: string
          name?: string | null
          batch?: unknown
        }
        if (!p?.seriesName || p.name || p.batch) return
        link(type, p.seriesName)
      }

    const pointer =
      (type: 'highlight' | 'downplay') =>
      (...args: unknown[]) => {
        const p = args[0] as {
          componentType?: string
          seriesId?: string
          seriesName?: string
          name?: string
        }
        if (p?.componentType !== 'series') return
        link(type, p.seriesId === SUMMARY_PIE_ID ? p.name : p.seriesName)
      }

    const onHighlight = relay('highlight')
    const onDownplay = relay('downplay')
    const onOver = pointer('highlight')
    const onOut = pointer('downplay')
    chart.on('highlight', onHighlight)
    chart.on('downplay', onDownplay)
    chart.on('mouseover', onOver)
    chart.on('mouseout', onOut)

    return () => {
      host.removeEventListener('mousemove', track, true)
      host.removeEventListener('mouseleave', leave, true)
      chart.off('highlight', onHighlight)
      chart.off('downplay', onDownplay)
      chart.off('mouseover', onOver)
      chart.off('mouseout', onOut)
    }
  }, [pie, chartRef, containerRef])

  return (
    <div
      role="img"
      aria-label="Combo chart"
      data-testid="combo-chart"
      className={cn(styles.root, className)}
      style={{
        position: 'relative',
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
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
  )
}

Combo.displayName = 'Combo'
