'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { getChartInstance, initChart, type ChartOption } from './echarts'

export interface EChartProps {
  option: ChartOption
  className?: string
  /** Height of the chart canvas. Width always fills the container. */
  height?: number | string
  'aria-label'?: string
}

/**
 * Thin, SSR-safe ECharts wrapper: initialises on mount, keeps the canvas sized
 * to its container via a ResizeObserver, re-applies `option` on change, and
 * disposes on unmount. Chart-type components build the `option`; this only
 * renders it.
 */
export function EChart({
  option,
  className,
  height = 260,
  'aria-label': ariaLabel,
}: EChartProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const chart = initChart(el)
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(el)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    getChartInstance(el)?.setOption(option, true)
  }, [option])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className={cn('w-full', className)}
      style={{ height }}
    />
  )
}
