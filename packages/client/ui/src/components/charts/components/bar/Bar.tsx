'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { BarChart as EBarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
  GraphicComponent,
} from 'echarts/components'
import { AxisBreak } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'
import { readCssColor } from '@/components/charts/utils'
import { useEChart } from '@/components/charts/hooks'
import type { EChartEventParams, EChartEvents } from '@/components/charts/hooks'
import {
  ChartLoading,
  CHART_SURFACE,
} from '@/components/charts/components/loading'
import { buildBarOption, getBarCategories } from './buildOption'
import { styles } from './styles'
import type { BarProps, BarDatum } from './types'

export type {
  BarProps,
  BarDatum,
  BarSeries,
  BarVariant,
  BarPalette,
  BarSort,
  BarReferenceLine,
} from './types'

echarts.use([
  EBarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
  GraphicComponent,
  AxisBreak,
  CanvasRenderer,
])

const COLLAPSE_BTN_NAME = 'cleraCollapseAxisBreak'

function resolveBarDatum(
  params: EChartEventParams,
  data: BarDatum[]
): [BarDatum, number] {
  const name = params.name ?? ''
  const index = data.findIndex(item => item.label === name)
  if (index >= 0) return [data[index], index]
  const value = typeof params.value === 'number' ? params.value : 0
  return [{ label: name, value }, params.dataIndex ?? -1]
}

export const Bar: React.FC<BarProps> = ({
  data = [],
  categories,
  series,
  max,
  min,
  showValues = true,
  formatValue = value => String(value),
  direction = 'horizontal',
  height = 300,
  showTooltip = true,
  tooltipTrigger = 'item',
  axisPointerLabel = true,
  showValueAxis = false,
  showLegend,
  legendPosition = 'top',
  legendIcon,
  legendAlign,
  legendStyle,
  stacked = false,
  stackMode = 'normal',
  highlightOnHover = false,
  showTrack = false,
  trackColor,
  gridLines,
  palette = 'brand',
  barRadius = 4,
  barWidth,
  sort = 'none',
  referenceLine,
  markPoints = [],
  axisBreaks = [],
  axisBreakExpandable = true,
  axisBreakCollapse,
  zoom = false,
  zoomSlider = true,
  selectable = false,
  axisLabelRotate = 0,
  xAxis,
  yAxis,
  xAxisLabel,
  loading = false,
  loadingVariant,
  loadingSize,
  loadingColor,
  loadingMask,
  animate = true,
  emptyMessage = 'No data',
  onBarClick,
  onBarHover,
  onBarLeave,
  onBrushSelect,
  onReady,
  className,
  style,
}) => {
  const isHorizontal = direction === 'horizontal'

  const buildOption = useCallback(
    () =>
      buildBarOption({
        data,
        categories,
        series,
        max,
        min,
        isHorizontal,
        showValues,
        formatValue,
        showTooltip,
        tooltipTrigger,
        axisPointerLabel,
        showValueAxis,
        showLegend,
        legendPosition,
        legendIcon,
        legendAlign,
        legendStyle,
        stacked,
        stackMode,
        highlightOnHover,
        showTrack,
        trackColor,
        gridLines,
        palette,
        barRadius,
        barWidth,
        sort,
        referenceLine,
        markPoints,
        axisBreaks,
        axisBreakExpandable,
        zoom,
        zoomSlider,
        selectable,
        axisLabelRotate,
        xAxis,
        yAxis,
        xAxisLabel,
        animate,
        emptyMessage,
      }),
    [
      data,
      categories,
      series,
      max,
      min,
      isHorizontal,
      showValues,
      formatValue,
      showTooltip,
      tooltipTrigger,
      axisPointerLabel,
      showValueAxis,
      showLegend,
      legendPosition,
      legendIcon,
      legendAlign,
      legendStyle,
      stacked,
      stackMode,
      highlightOnHover,
      showTrack,
      trackColor,
      gridLines,
      palette,
      barRadius,
      barWidth,
      sort,
      referenceLine,
      markPoints,
      axisBreaks,
      axisBreakExpandable,
      zoom,
      zoomSlider,
      selectable,
      axisLabelRotate,
      xAxis,
      yAxis,
      xAxisLabel,
      animate,
      emptyMessage,
    ]
  )

  const chartRef = useRef<ECharts | null>(null)
  const handleReady = useCallback(
    (chart: ECharts) => {
      chartRef.current = chart
      onReady?.(chart)
    },
    [onReady]
  )

  const events = useMemo<EChartEvents>(
    () => ({
      click: params => {
        if (params.name === COLLAPSE_BTN_NAME) {
          chartRef.current?.dispatchAction({
            type: 'collapseAxisBreak',
            [isHorizontal ? 'xAxisIndex' : 'yAxisIndex']: 0,
            breaks: axisBreaks,
          })
          return
        }
        const [datum, index] = resolveBarDatum(params, data)
        onBarClick?.(datum, index)
      },
      axisbreakchanged: params => {
        const expanded = (params.breaks ?? []).some(item => item.isExpanded)
        const text = axisBreakCollapse?.text ?? 'Collapse breaks'
        const fontSize = axisBreakCollapse?.textStyle?.fontSize ?? 11
        const fontWeight = axisBreakCollapse?.textStyle?.fontWeight ?? 'bold'
        const paddingX = axisBreakCollapse?.buttonStyle?.paddingX ?? 12
        const [left, top] = axisBreakCollapse?.offset ?? [8, 8]
        const height = fontSize + 12
        const width = Math.round(text.length * fontSize * 0.6) + paddingX * 2

        chartRef.current?.setOption({
          graphic: [
            {
              id: COLLAPSE_BTN_NAME,
              type: 'group',
              name: COLLAPSE_BTN_NAME,
              ignore: !expanded,
              left,
              top,
              z: 100,
              children: [
                {
                  type: 'rect',
                  name: COLLAPSE_BTN_NAME,
                  shape: {
                    x: 0,
                    y: 0,
                    width,
                    height,
                    r: axisBreakCollapse?.buttonStyle?.borderRadius ?? 4,
                  },
                  style: {
                    fill:
                      axisBreakCollapse?.buttonStyle?.fill ??
                      readCssColor(
                        '--background-color-ds-elevation-surface-raised',
                        'rgb(255, 255, 255)'
                      ),
                    stroke:
                      axisBreakCollapse?.buttonStyle?.stroke ??
                      readCssColor(
                        '--border-color-ds-default',
                        'rgb(229, 229, 229)'
                      ),
                    lineWidth: 1,
                  },
                },
                {
                  type: 'text',
                  silent: true,
                  style: {
                    text,
                    x: width / 2,
                    y: height / 2,
                    align: 'center',
                    verticalAlign: 'middle',
                    fontSize,
                    fontWeight,
                    fill:
                      axisBreakCollapse?.textStyle?.color ??
                      readCssColor(
                        '--text-color-ds-default',
                        'rgb(23, 23, 23)'
                      ),
                  },
                },
              ],
            },
          ],
        })
      },
      mouseover: params => {
        if (params.componentType !== 'series') return
        const [datum, index] = resolveBarDatum(params, data)
        onBarHover?.(datum, index)
      },
      mouseout: () => onBarLeave?.(),
      brushselected: params => {
        if (!onBrushSelect) return
        const selected = params.batch?.[0]?.selected ?? []
        const indices = Array.from(
          new Set(selected.flatMap(item => item.dataIndex ?? []))
        )
        const display = getBarCategories({
          data,
          categories,
          series,
          sort,
          isHorizontal,
        })
        const labels = indices
          .map(indice => display[indice])
          .filter((label): label is string => Boolean(label))
        onBrushSelect({ indices, labels })
      },
    }),
    [
      data,
      categories,
      series,
      sort,
      isHorizontal,
      axisBreaks,
      axisBreakCollapse,
      onBarClick,
      onBarHover,
      onBarLeave,
      onBrushSelect,
    ]
  )

  const { containerRef } = useEChart({
    buildOption,
    events,
    onReady: handleReady,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el || !zoom) return
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY >= 0) return
      const opt = chartRef.current?.getOption() as
        | {
            dataZoom?: Array<{
              type?: string
              start?: number
              end?: number
              minSpan?: number
            }>
          }
        | undefined
      const atMin = (opt?.dataZoom ?? []).some(
        item =>
          item.type === 'inside' &&
          (item.end ?? 100) - (item.start ?? 0) <= (item.minSpan ?? 0) + 0.1
      )
      if (atMin) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    el.addEventListener('wheel', onWheel, { capture: true, passive: false })
    return () => el.removeEventListener('wheel', onWheel, { capture: true })
  }, [zoom, containerRef])

  return (
    <div
      role="img"
      aria-label="Bar chart"
      data-testid="bar-chart"
      className={cn(
        styles.root,
        zoom && '[&_canvas]:!cursor-grab active:[&_canvas]:!cursor-grabbing',
        className
      )}
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

Bar.displayName = 'Bar'
