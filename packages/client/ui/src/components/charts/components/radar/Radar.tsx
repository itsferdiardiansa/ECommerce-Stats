'use client'

import React, { useCallback, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import {
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import type { EChartEvents } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildRadarOption } from './buildOption'
import { resolveSeriesClick } from './helpers'
import { styles } from './styles'
import type { RadarProps } from './types'

export type {
  RadarProps,
  RadarSeries,
  RadarIndicator,
  RadarVariant,
  RadarPalette,
  RadarShape,
  RadarSeriesClick,
} from './types'

echarts.use([
  RadarChart,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
])

export const Radar: React.FC<RadarProps> = ({
  indicators,
  series,
  height = 360,
  title,
  subtitle,
  palette = 'categorical',
  shape = 'polygon',
  max,
  radius = '65%',
  area = false,
  lineWidth = 2,
  showSymbol = true,
  symbolSize = 4,
  gridLines = true,
  splitArea = true,
  showTooltip = true,
  showLegend,
  legendPosition = 'top',
  legendIcon,
  legendAlign,
  legendStyle,
  highlightOnHover = false,
  formatValue = value => String(value),
  loading = false,
  loadingVariant,
  loadingSize,
  loadingColor,
  loadingMask,
  animate = true,
  emptyMessage = 'No data',
  onSeriesClick,
  onReady,
  className,
  style,
}) => {
  const buildOption = useCallback(
    () =>
      buildRadarOption({
        indicators,
        series,
        title,
        subtitle,
        palette,
        shape,
        max,
        radius,
        area,
        lineWidth,
        showSymbol,
        symbolSize,
        gridLines,
        splitArea,
        showTooltip,
        showLegend,
        legendPosition,
        legendIcon,
        legendAlign,
        legendStyle,
        highlightOnHover,
        formatValue,
        animate,
        emptyMessage,
      }),
    [
      indicators,
      series,
      title,
      subtitle,
      palette,
      shape,
      max,
      radius,
      area,
      lineWidth,
      showSymbol,
      symbolSize,
      gridLines,
      splitArea,
      showTooltip,
      showLegend,
      legendPosition,
      legendIcon,
      legendAlign,
      legendStyle,
      highlightOnHover,
      formatValue,
      animate,
      emptyMessage,
    ]
  )

  const events = useMemo<EChartEvents>(
    () => ({
      click: params => {
        if (params.componentType !== 'series') return
        onSeriesClick?.(resolveSeriesClick(params))
      },
    }),
    [onSeriesClick]
  )

  const { containerRef } = useEChart({ buildOption, events, onReady })

  return (
    <div
      role="img"
      aria-label="Radar chart"
      data-testid="radar-chart"
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

Radar.displayName = 'Radar'
