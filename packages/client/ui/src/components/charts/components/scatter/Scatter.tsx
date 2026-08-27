'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as echarts from 'echarts/core'
import {
  ScatterChart as EScatterChart,
  CustomChart,
  LineChart,
  BarChart,
} from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  TimelineComponent,
  AxisPointerComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import type { EChartEvents } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import {
  buildScatterOption,
  panelCountOf,
  computePanelLayout,
} from './buildOption'
import { resolvePoint } from './helpers'
import { styles } from './styles'
import type { ScatterProps, ScatterView } from './types'

export type {
  ScatterProps,
  ScatterSeries,
  ScatterPoint,
  ScatterVariant,
  ScatterPalette,
  ScatterXAxis,
  ScatterYAxis,
  ScatterTrendLine,
  ScatterRegression,
  ScatterPointClick,
  ScatterBoundary,
  ScatterStep,
  ScatterAggregate,
  ScatterView,
} from './types'

echarts.use([
  EScatterChart,
  CustomChart,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  TimelineComponent,
  AxisPointerComponent,
  UniversalTransition,
  CanvasRenderer,
])

export const Scatter: React.FC<ScatterProps> = ({
  series = [],
  height = 360,
  title,
  subtitle,
  showCrosshair = false,
  palette = 'categorical',
  symbolSize = 10,
  xAxis,
  yAxis,
  columns = 2,
  gridLines = true,
  showTooltip = true,
  showLegend,
  legendPosition = 'top',
  legendIcon,
  legendAlign,
  legendStyle,
  steps,
  autoPlay = false,
  playInterval = 2500,
  highlightOnHover = false,
  aggregate,
  view = 'scatter',
  autoToggle = false,
  holdDuration = 1500,
  transitionDuration = 1000,
  formatValue = value => String(value),
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
  const panelCount = useMemo(() => panelCountOf(series), [series])
  const multiPanel = panelCount > 0

  // When `autoToggle` is on, the component drives the scatter↔bar view itself
  // on a timer — re-armed after each flip so the hold always begins once the
  // morph (transitionDuration) has finished, not while it's still animating.
  const cycling = Boolean(autoToggle && aggregate)
  const [autoView, setAutoView] = useState<ScatterView>(view)
  useEffect(() => {
    if (!cycling) return
    const id = setTimeout(
      () => setAutoView(value => (value === 'scatter' ? 'bar' : 'scatter')),
      transitionDuration + holdDuration
    )
    return () => clearTimeout(id)
  }, [cycling, autoView, transitionDuration, holdDuration])
  const effectiveView = cycling ? autoView : view

  const buildOption = useCallback(
    (ctx: { width: number }) =>
      buildScatterOption({
        series,
        title,
        subtitle,
        showCrosshair,
        palette,
        symbolSize,
        xAxis,
        yAxis,
        columns,
        width: ctx.width,
        gridLines,
        showTooltip,
        showLegend,
        legendPosition,
        legendIcon,
        legendAlign,
        legendStyle,
        steps,
        autoPlay,
        playInterval,
        highlightOnHover,
        aggregate,
        view: effectiveView,
        transitionDuration,
        formatValue,
        animate,
        emptyMessage,
      }),
    [
      series,
      title,
      subtitle,
      showCrosshair,
      palette,
      symbolSize,
      xAxis,
      yAxis,
      columns,
      gridLines,
      showTooltip,
      showLegend,
      legendPosition,
      legendIcon,
      legendAlign,
      legendStyle,
      steps,
      autoPlay,
      playInterval,
      highlightOnHover,
      aggregate,
      effectiveView,
      transitionDuration,
      formatValue,
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

  const { containerRef, width } = useEChart({
    buildOption,
    events,
    onReady,
    rebuildOnResize: multiPanel,
  })

  const resolvedHeight = multiPanel
    ? `${computePanelLayout(panelCount, columns, width, Boolean(title)).height}px`
    : typeof height === 'number'
      ? `${height}px`
      : height

  return (
    <div
      role="img"
      aria-label="Scatter chart"
      data-testid="scatter-chart"
      className={cn(styles.root, className)}
      style={{
        position: 'relative',
        height: resolvedHeight,
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

Scatter.displayName = 'Scatter'
