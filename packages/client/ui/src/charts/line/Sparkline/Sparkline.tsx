'use client'

import * as React from 'react'
import { EChart } from '@/charts/core/EChart'
import { useChartTheme } from '@/charts/core/useChartTheme'
import { chartTooltip } from '@/charts/core/tooltip'
import type { ChartOption } from '@/charts/core/echarts'

export interface SparklineProps {
  data: number[]
  height?: number | string
  /** Force a colour; otherwise it's green when trending up, red when down. */
  color?: string
  className?: string
  ariaLabel?: string
}

/** Compact, axis-less trend line with a gradient fill - Yahoo-Finance style. */
export function Sparkline({
  data,
  height = 44,
  color,
  className,
  ariaLabel,
}: SparklineProps) {
  const theme = useChartTheme()

  const option = React.useMemo<ChartOption>(() => {
    const up = data.length < 2 || data[data.length - 1] >= data[0]
    const stroke = color ?? (up ? '#059669' : '#e11d48')
    return {
      grid: { top: 4, right: 2, bottom: 4, left: 2 },
      xAxis: {
        type: 'category',
        show: false,
        boundaryGap: false,
        data: data.map((_, index) => index),
      },
      yAxis: { type: 'value', show: false, scale: true },
      tooltip: {
        ...chartTooltip(theme),
        trigger: 'axis',
        confine: true,
        formatter: params => {
          const p = Array.isArray(params) ? params[0] : params
          return `${(p as { data: number }).data}`
        },
      },
      series: [
        {
          type: 'line',
          data,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.75, color: stroke },
          areaStyle: { color: stroke, opacity: 0.14 },
        },
      ],
    }
  }, [data, color, theme])

  return (
    <EChart
      option={option}
      height={height}
      className={className}
      aria-label={ariaLabel}
    />
  )
}
