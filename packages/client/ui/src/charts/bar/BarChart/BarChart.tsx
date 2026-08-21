'use client'

import * as React from 'react'
import { EChart } from '@/charts/core/EChart'
import { useChartTheme } from '@/charts/core/useChartTheme'
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
  valueFormatter,
  className,
  ariaLabel,
}: BarChartProps) {
  const theme = useChartTheme()

  const option = React.useMemo<ChartOption>(() => {
    const fmt = valueFormatter ?? ((v: number) => `${v}`)
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
            icon: 'roundRect',
          }
        : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.text },
        valueFormatter: value => fmt(Number(value)),
      },
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? catAxis : valAxis,
      series: series.map(s => ({
        type: 'bar',
        name: s.name,
        data: s.data,
        stack: stacked ? 'total' : undefined,
        itemStyle: {
          color: s.color,
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        barMaxWidth: 28,
      })),
    }
  }, [
    categories,
    series,
    horizontal,
    stacked,
    showLegend,
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
