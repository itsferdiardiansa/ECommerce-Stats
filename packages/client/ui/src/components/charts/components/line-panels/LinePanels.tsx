'use client'

import React, { useCallback } from 'react'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  AxisPointerComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildLinePanelsOption } from './buildOption'
import { styles } from './styles'
import type { LinePanelsProps } from './types'

export type { LinePanelsProps, LinePanel, LinePanelSeries } from './types'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  AxisPointerComponent,
  DataZoomComponent,
  CanvasRenderer,
])

export const LinePanels: React.FC<LinePanelsProps> = ({
  categories,
  xAxisType = 'category',
  panels,
  height = 420,
  area = false,
  curve = 'straight',
  zoom = false,
  zoomSlider = true,
  xAxisPerPanel = false,
  showTooltip = true,
  axisPointerLabel = true,
  formatValue = value => String(value),
  formatX,
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
      buildLinePanelsOption({
        categories,
        xAxisType,
        panels,
        area,
        curve,
        zoom,
        zoomSlider,
        xAxisPerPanel,
        showTooltip,
        axisPointerLabel,
        formatValue,
        formatX,
        animate,
        emptyMessage,
      }) as unknown as EChartsCoreOption,
    [
      categories,
      xAxisType,
      panels,
      area,
      curve,
      zoom,
      zoomSlider,
      xAxisPerPanel,
      showTooltip,
      axisPointerLabel,
      formatValue,
      formatX,
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
      aria-label="Stacked line panels chart"
      data-testid="line-panels-chart"
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

LinePanels.displayName = 'LinePanels'
