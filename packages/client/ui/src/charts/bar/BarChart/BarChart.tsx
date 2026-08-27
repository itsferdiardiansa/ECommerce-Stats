'use client'

import * as React from 'react'
import { EChart } from '@/charts/core/EChart'
import { useChartTheme } from '@/charts/core/useChartTheme'
import { legendMarkerStyle, type LegendMarker } from '@/charts/core/legend'
import { chartTooltip } from '@/charts/core/tooltip'
import type { ChartOption } from '@/charts/core/echarts'

export interface BarSeries {
  name: string
  data: number[]
  color?: string
}

export interface BarChartProps {
  categories: (string | number)[]
  series: BarSeries[]
  height?: number | string
  horizontal?: boolean
  stacked?: boolean
  showLegend?: boolean
  /** Legend marker shape + size (default: small square). */
  legendMarker?: LegendMarker
  /** Draws a subtle track behind every bar. */
  showBackground?: boolean
  /** Hovering a series highlights it and fades the others to 0.4 opacity. */
  focusSeries?: boolean
  valueFormatter?: (value: number) => string
  className?: string
  ariaLabel?: string
}

/** Bar / column chart - grouped or stacked, vertical or horizontal. */
export function BarChart({
  categories,
  series,
  height = 260,
  horizontal = false,
  stacked = false,
  showLegend = false,
  legendMarker,
  showBackground = false,
  focusSeries = false,
  valueFormatter,
  className,
  ariaLabel,
}: BarChartProps) {
  const theme = useChartTheme()

  const option = React.useMemo<ChartOption>(() => {
    const fmt = valueFormatter ?? ((value: number) => `${value}`)
    const catAxis = {
      type: 'category' as const,
      data: categories,
      axisLine: { lineStyle: { color: theme.axis } },
      axisTick: { show: false },
      axisLabel: { color: theme.text, fontSize: 11 },
    }
    const valAxis = {
      type: 'value' as const,
      splitLine: { lineStyle: { color: theme.split } },
      axisLabel: { color: theme.text, fontSize: 11, formatter: fmt },
    }
    return {
      color: theme.palette,
      grid: {
        top: showLegend ? 34 : 12,
        right: 16,
        bottom: 8,
        left: 8,
        containLabel: true,
      },
      legend: showLegend
        ? {
            top: 0,
            right: 0,
            textStyle: { color: theme.text },
            ...legendMarkerStyle(legendMarker),
          }
        : undefined,
      tooltip: {
        ...chartTooltip(theme),
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: value => fmt(Number(value)),
      },
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? catAxis : valAxis,
      series: series.map(item => ({
        type: 'bar',
        name: item.name,
        data: item.data,
        stack: stacked ? 'total' : undefined,
        itemStyle: {
          color: item.color,
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        barMaxWidth: 28,
        showBackground,
        backgroundStyle: showBackground
          ? {
              color: theme.split,
              borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
            }
          : undefined,
        emphasis: focusSeries ? { focus: 'series' } : undefined,
        blur: focusSeries ? { itemStyle: { opacity: 0.4 } } : undefined,
      })),
    }
  }, [
    categories,
    series,
    horizontal,
    stacked,
    showLegend,
    legendMarker,
    showBackground,
    focusSeries,
    valueFormatter,
    theme,
  ])

  return (
    <EChart
      option={option}
      height={height}
      className={className}
      aria-label={ariaLabel}
    />
  )
}
