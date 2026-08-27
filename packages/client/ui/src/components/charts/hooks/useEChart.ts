'use client'

import { useRef, useEffect, useState } from 'react'
import * as echarts from 'echarts/core'
import type { ECharts, EChartsCoreOption } from 'echarts/core'
import {
  setColorScope,
  syncCustomLegendIconOpacity,
} from '@/components/charts/utils'

export interface EChartBuildContext {
  compact: boolean
  stacked: boolean
  width: number
  height: number
}

export interface EChartEventParams {
  componentType?: string
  seriesType?: string
  seriesName?: string
  seriesIndex?: number
  name?: string
  value?: unknown
  dataIndex?: number
  batch?: Array<{ selected?: Array<{ dataIndex?: number[] }> }>
  breaks?: Array<{ start?: number; end?: number; isExpanded?: boolean }>
  axesInfo?: Array<{ axisDim?: string; axisIndex?: number; value?: unknown }>
}

export type EChartEvents = Record<string, (params: EChartEventParams) => void>

export interface UseEChartOptions {
  buildOption: (ctx: EChartBuildContext) => EChartsCoreOption
  events?: EChartEvents
  onReady?: (chart: ECharts) => void
  compactBelow?: number
  stackBelow?: number
  /**
   * Re-run `buildOption` (not just `chart.resize()`) whenever the container's
   * size changes. Off by default so most charts just resize; opt in when the
   * option itself depends on pixel size (e.g. a calendar's square cell size).
   */
  rebuildOnResize?: boolean
}

/**
 * Shared ECharts runtime: init, resize, dispose, theme re-resolution,
 * imperative `onReady` escape hatch, and event binding. Chart components supply
 * a `buildOption` builder and register their own ECharts modules; everything
 * else (lifecycle + theme reactivity) is handled here so every chart behaves
 * consistently.
 */
function withChartFont(
  el: HTMLDivElement | null,
  option: EChartsCoreOption
): EChartsCoreOption {
  if (!el) return option
  const fontFamily = getComputedStyle(el).fontFamily
  if (!fontFamily) return option
  const base = option as { textStyle?: Record<string, unknown> }
  return { ...option, textStyle: { fontFamily, ...(base.textStyle ?? {}) } }
}

export function useEChart({
  buildOption,
  events,
  onReady,
  compactBelow,
  stackBelow,
  rebuildOnResize = false,
}: UseEChartOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)

  const [compact, setCompact] = useState(false)
  const compactRef = useRef(compact)
  useEffect(() => {
    compactRef.current = compact
  }, [compact])

  const [size, setSize] = useState({ width: 0, height: 0 })
  const sizeRef = useRef(size)
  useEffect(() => {
    sizeRef.current = size
  }, [size])

  const rebuildOnResizeRef = useRef(rebuildOnResize)
  useEffect(() => {
    rebuildOnResizeRef.current = rebuildOnResize
  }, [rebuildOnResize])

  const [stacked, setStacked] = useState(false)
  const stackedRef = useRef(stacked)
  useEffect(() => {
    stackedRef.current = stacked
  }, [stacked])

  const compactBelowRef = useRef(compactBelow)
  useEffect(() => {
    compactBelowRef.current = compactBelow
  }, [compactBelow])

  const stackBelowRef = useRef(stackBelow)
  useEffect(() => {
    stackBelowRef.current = stackBelow
  }, [stackBelow])

  const buildOptionRef = useRef(buildOption)
  useEffect(() => {
    buildOptionRef.current = buildOption
  }, [buildOption])

  const eventsRef = useRef(events)
  useEffect(() => {
    eventsRef.current = events
  }, [events])

  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    Object.keys(eventsRef.current ?? {}).forEach(name => {
      chart.on(name, (params: unknown) =>
        eventsRef.current?.[name]?.(params as EChartEventParams)
      )
    })

    chart.on('legendselectchanged', (params: unknown) => {
      const selected = (params as { selected?: Record<string, boolean> })
        .selected
      if (selected) syncCustomLegendIconOpacity(chart, selected)
    })

    onReadyRef.current?.(chart)

    const settle = () => {
      chart.off('finished', settle)
      chartRef.current?.resize()
    }
    chart.on('finished', settle)

    let lastWidth = -1
    let lastHeight = -1
    const resizeIfChanged = () => {
      const { clientWidth, clientHeight } = el
      if (clientWidth > 0) {
        const compactAt = compactBelowRef.current
        if (compactAt) setCompact(clientWidth < compactAt)
        const stackAt = stackBelowRef.current
        if (stackAt) setStacked(clientWidth < stackAt)
      }
      if (clientWidth === lastWidth && clientHeight === lastHeight) return
      lastWidth = clientWidth
      lastHeight = clientHeight
      chartRef.current?.resize()
      if (rebuildOnResizeRef.current) {
        setSize({ width: clientWidth, height: clientHeight })
      }
    }

    const observer = new ResizeObserver(resizeIfChanged)
    observer.observe(el)
    resizeIfChanged()

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(resizeIfChanged)
    }

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const apply = () => {
      setColorScope(containerRef.current)
      chartRef.current?.setOption(
        withChartFont(
          containerRef.current,
          buildOptionRef.current({
            compact: compactRef.current,
            stacked: stackedRef.current,
            width: sizeRef.current.width,
            height: sizeRef.current.height,
          })
        ),
        true
      )
    }

    // Subtree so a nested `data-theme` scope (e.g. a themed canvas) re-themes
    // the chart, not just the root <html>. Limited to `data-theme` only —
    // watching `class` across the subtree would fire on every hover/focus.
    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-theme'],
    })

    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null
    media?.addEventListener('change', apply)

    return () => {
      observer.disconnect()
      media?.removeEventListener('change', apply)
    }
  }, [])

  useEffect(() => {
    setColorScope(containerRef.current)
    const chart = chartRef.current
    if (!chart) return

    const option = buildOption({
      compact,
      stacked,
      width: size.width,
      height: size.height,
    })

    // A full rebuild (`notMerge`) drops the legend's selected state, so a
    // series the user hid would reappear on theme changes or a morph. Carry
    // the current selection into the new option (matched by series name).
    const prevLegend = (chart.getOption?.() as { legend?: unknown[] })?.legend
    const selected = Array.isArray(prevLegend)
      ? (prevLegend[0] as { selected?: Record<string, boolean> })?.selected
      : undefined
    const legend = (option as { legend?: unknown }).legend
    if (selected && legend && typeof legend === 'object') {
      const target = Array.isArray(legend) ? legend[0] : legend
      if (target && typeof target === 'object') {
        ;(target as { selected?: Record<string, boolean> }).selected = {
          ...(target as { selected?: Record<string, boolean> }).selected,
          ...selected,
        }
      }
    }

    chart.setOption(withChartFont(containerRef.current, option), true)
  }, [buildOption, compact, stacked, size])

  return { containerRef, chartRef, compact, stacked, width: size.width }
}
