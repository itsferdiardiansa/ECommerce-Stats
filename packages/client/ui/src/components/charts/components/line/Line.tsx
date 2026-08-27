'use client'

import React, { useCallback, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { LineChart as ELineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent,
  DataZoomComponent,
  VisualMapComponent,
  AxisPointerComponent,
  ToolboxComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import type { EChartEvents } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildLineOption } from './buildOption'
import { resolvePoint } from './helpers'
import { styles } from './styles'
import type { LineProps } from './types'

export type {
  LineProps,
  LineSeries,
  LinePoint,
  LineVariant,
  LinePalette,
  LineCurve,
  LineXAxisType,
  LineMarkPoint,
  LineReferenceLine,
  LineMarkArea,
  LineThreshold,
  LinePointClick,
} from './types'

echarts.use([
  ELineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent,
  DataZoomComponent,
  VisualMapComponent,
  AxisPointerComponent,
  ToolboxComponent,
  CanvasRenderer,
])

export const Line: React.FC<LineProps> = ({
  categories,
  series,
  xAxisType = 'category',
  height = 320,
  curve = 'straight',
  area = false,
  palette = 'categorical',
  showSymbol = false,
  symbolSize = 6,
  lineWidth = 2,
  connectNulls = false,
  min,
  max,
  showValueAxis = true,
  gridLines,
  yAxes,
  xAxis,
  axisLabelRotate = 0,
  xAxisLabel,
  showTooltip = true,
  tooltipTrigger = 'axis',
  showLegend,
  legendPosition = 'top',
  legendIcon,
  legendAlign,
  legendStyle,
  highlightOnHover = false,
  threshold,
  referenceLine,
  markArea,
  markPoints = [],
  zoom = false,
  zoomSlider = true,
  zoomWindow,
  toolbox = false,
  sparkline = false,
  formatValue = value => String(value),
  formatX,
  loading = false,
  loadingVariant,
  loadingSize,
  loadingColor,
  loadingMask,
  animate = true,
  emptyMessage = 'No data',
  onPointClick,
  onReady,
  className,
  style,
}) => {
  const buildOption = useCallback(
    () =>
      buildLineOption({
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
      }),
    [
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
    ]
  )

  const events = useMemo<EChartEvents>(
    () => ({
      click: params => {
        if (params.componentType !== 'series') return
        onPointClick?.(resolvePoint(params))
      },
    }),
    [onPointClick]
  )

  const { containerRef } = useEChart({
    buildOption,
    events,
    onReady,
  })

  return (
    <div
      role="img"
      aria-label="Line chart"
      data-testid="line-chart"
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

Line.displayName = 'Line'
