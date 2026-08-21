'use client'

import * as React from 'react'
import { EChart } from '@/charts/core/EChart'
import { useChartTheme } from '@/charts/core/useChartTheme'
import type { ChartOption } from '@/charts/core/echarts'

export interface AreaLineSeries {
  name: string
  data: number[]
  /** Overrides the themed palette colour for this series. */
  color?: string
}

export interface AreaLineChartProps {
  categories: (string | number)[]
  series: AreaLineSeries[]
  height?: number | string
  showLegend?: boolean
  /** Formats the axis + tooltip values (e.g. currency). */
  valueFormatter?: (value: number) => string
  smooth?: boolean
  className?: string
  ariaLabel?: string
}

/** Area line chart - one or more smoothed series with a soft gradient fill. */
export function AreaLineChart({
  categories,
  series,
  height = 260,
  showLegend = false,
  valueFormatter,
  smooth = true,
  className,
  ariaLabel,
}: AreaLineChartProps) {
  const theme = useChartTheme()

  const option = React.useMemo<ChartOption>(() => {
    const fmt = valueFormatter ?? ((v: number) => `${v}`)
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
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.text },
        valueFormatter: value => fmt(Number(value)),
      },
      xAxis: {
        type: 'category',
        data: categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: theme.axis } },
        axisTick: { show: false },
        axisLabel: { color: theme.text, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.split } },
        axisLabel: { color: theme.text, fontSize: 11, formatter: fmt },
      },
      series: series.map((s, i) => ({
        type: 'line',
        name: s.name,
        data: s.data,
        smooth,
        showSymbol: false,
        lineStyle: { width: 2, color: s.color },
        itemStyle: { color: s.color },
        areaStyle: { opacity: series.length > 1 ? 0.12 : 0.18 },
        z: series.length - i,
      })),
    }
  }, [categories, series, showLegend, smooth, valueFormatter, theme])

  return (
    <EChart
      option={option}
      height={height}
      className={className}
      aria-label={ariaLabel}
    />
  )
}
