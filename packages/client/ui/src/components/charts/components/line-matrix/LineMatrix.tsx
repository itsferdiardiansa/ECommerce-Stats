'use client'

import React, { useCallback } from 'react'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  MatrixComponent,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { useEChart } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildLineMatrixOption } from './buildOption'
import { styles } from './styles'
import type { LineMatrixProps } from './types'

export type { LineMatrixProps, LineMatrixRow, LineMatrixCell } from './types'

echarts.use([
  LineChart,
  MatrixComponent,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  CanvasRenderer,
])

export const LineMatrix: React.FC<LineMatrixProps> = ({
  columns,
  rows,
  cells,
  height = 520,
  cornerLabel,
  area = true,
  curve = 'straight',
  colorByTrend = false,
  zoom = false,
  zoomSlider = true,
  showCellLabel = true,
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
      buildLineMatrixOption({
        columns,
        rows,
        cells,
        cornerLabel,
        area,
        curve,
        colorByTrend,
        zoom,
        zoomSlider,
        showCellLabel,
        formatValue,
        formatX,
        animate,
        emptyMessage,
      }) as unknown as EChartsCoreOption,
    [
      columns,
      rows,
      cells,
      cornerLabel,
      area,
      curve,
      colorByTrend,
      zoom,
      zoomSlider,
      showCellLabel,
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
      aria-label="Line matrix chart"
      data-testid="line-matrix-chart"
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

LineMatrix.displayName = 'LineMatrix'
