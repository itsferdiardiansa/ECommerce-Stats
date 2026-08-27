'use client'

import React, { useCallback } from 'react'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { LineChart } from 'echarts/charts'
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
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildMultiXLineOption } from './buildOption'
import { styles } from './styles'
import type { MultiXLineProps } from './types'

export type {
  MultiXLineProps,
  MultiXLineXAxis,
  MultiXLineYAxis,
  MultiXSeries,
} from './types'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  AxisPointerComponent,
  CanvasRenderer,
])

export const MultiXLine: React.FC<MultiXLineProps> = ({
  xAxes,
  yAxis,
  height = 360,
  curve = 'smooth',
  area = false,
  showLegend = true,
  legendIcon,
  legendAlign,
  legendStyle,
  min,
  max,
  showTooltip = true,
  highlightOnHover = true,
  formatValue = value => String(value),
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
  const buildOption = useCallback(
    () =>
      buildMultiXLineOption({
        xAxes,
        curve,
        area,
        showLegend,
        legendIcon,
        legendAlign,
        legendStyle,
        min,
        max,
        yAxis,
        showTooltip,
        highlightOnHover,
        formatValue,
        animate,
        emptyMessage,
      }) as unknown as EChartsCoreOption,
    [
      xAxes,
      curve,
      area,
      showLegend,
      legendIcon,
      legendAlign,
      legendStyle,
      min,
      max,
      yAxis,
      showTooltip,
      highlightOnHover,
      formatValue,
      animate,
      emptyMessage,
    ]
  )

  const { containerRef } = useEChart({
    buildOption,
    onReady,
  })

  return (
    <div
      role="img"
      aria-label="Multiple x-axis line chart"
      data-testid="multi-x-line-chart"
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

MultiXLine.displayName = 'MultiXLine'
