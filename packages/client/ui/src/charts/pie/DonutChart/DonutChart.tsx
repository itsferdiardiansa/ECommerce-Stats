'use client'

import * as React from 'react'
import { EChart } from '@/charts/core/EChart'
import { useChartTheme } from '@/charts/core/useChartTheme'
import { chartTooltip } from '@/charts/core/tooltip'
import type { ChartOption } from '@/charts/core/echarts'

export interface DonutSlice {
  name: string
  value: number
  color?: string
}

export interface DonutChartProps {
  data: DonutSlice[]
  height?: number | string
  /** Text shown in the centre of the ring. */
  centerLabel?: string
  centerValue?: string
  showLegend?: boolean
  valueFormatter?: (value: number) => string
  className?: string
  ariaLabel?: string
}

/** Donut chart - part-to-whole breakdown with an optional centre label. */
export function DonutChart({
  data,
  height = 260,
  centerLabel,
  centerValue,
  showLegend = true,
  valueFormatter,
  className,
  ariaLabel,
}: DonutChartProps) {
  const theme = useChartTheme()

  const option = React.useMemo<ChartOption>(() => {
    const fmt = valueFormatter ?? ((value: number) => `${value}`)
    return {
      color: theme.palette,
      tooltip: {
        ...chartTooltip(theme),
        trigger: 'item',
        valueFormatter: value => fmt(Number(value)),
      },
      legend: showLegend
        ? {
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            textStyle: { color: theme.text },
            icon: 'circle',
            itemWidth: 8,
            itemHeight: 8,
          }
        : undefined,
      graphic:
        centerLabel || centerValue
          ? [
              {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: `${centerValue ?? ''}\n${centerLabel ?? ''}`,
                  textAlign: 'center',
                  textVerticalAlign: 'middle',
                  fill: theme.text,
                  fontSize: 13,
                  lineHeight: 18,
                },
              },
            ]
          : undefined,
      series: [
        {
          type: 'pie',
          radius: ['54%', '76%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          data: data.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: item.color ? { color: item.color } : undefined,
          })),
        },
      ],
    }
  }, [data, centerLabel, centerValue, showLegend, valueFormatter, theme])

  return (
    <EChart
      option={option}
      height={height}
      className={className}
      aria-label={ariaLabel}
    />
  )
}
