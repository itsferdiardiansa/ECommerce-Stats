'use client'

import React, { useCallback, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { BarChart as EBarChart } from 'echarts/charts'
import {
  PolarComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import type { EChartEventParams, EChartEvents } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildPolarBarOption } from './buildOption'
import { styles } from './styles'
import type { PolarBarProps, PolarBarDatum } from './types'

export type {
  PolarBarProps,
  PolarBarDatum,
  PolarBarSeries,
  PolarBarOrientation,
  PolarBarPalette,
} from './types'

echarts.use([
  EBarChart,
  PolarComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
])

function resolveDatum(
  params: EChartEventParams,
  data: PolarBarDatum[]
): [PolarBarDatum, number] {
  const name = params.name ?? ''
  const index = data.findIndex(item => item.label === name)
  if (index >= 0) return [data[index], index]
  const value = typeof params.value === 'number' ? params.value : 0
  return [{ label: name, value }, params.dataIndex ?? -1]
}

export const PolarBar: React.FC<PolarBarProps> = ({
  data = [],
  categories,
  series,
  orientation = 'angular',
  height = 360,
  stacked = false,
  highlightOnHover = false,
  max,
  min,
  showValues = false,
  showTooltip = true,
  showLegend,
  legendPosition = 'top',
  legendIcon,
  legendAlign,
  legendStyle,
  palette = 'brand',
  barRadius = 4,
  roundCap = true,
  startAngle = 90,
  endAngle,
  formatValue = value => String(value),
  labelFormatter,
  loading = false,
  loadingVariant,
  loadingSize,
  loadingColor,
  loadingMask,
  animate = true,
  emptyMessage = 'No data',
  onBarClick,
  onReady,
  className,
  style,
}) => {
  const buildOption = useCallback(
    () =>
      buildPolarBarOption({
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
      }),
    [
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
    ]
  )

  const events = useMemo<EChartEvents>(
    () => ({
      click: params => {
        const [datum, index] = resolveDatum(params, data)
        onBarClick?.(datum, index)
      },
    }),
    [data, onBarClick]
  )

  const { containerRef } = useEChart({
    buildOption,
    events,
    onReady,
  })

  return (
    <div
      role="img"
      aria-label="Polar bar chart"
      data-testid="polar-bar-chart"
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

PolarBar.displayName = 'PolarBar'
