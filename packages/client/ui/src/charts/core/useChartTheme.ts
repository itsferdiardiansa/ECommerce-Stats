'use client'

import * as React from 'react'

export interface ChartTheme {
  text: string
  axis: string
  split: string
  tooltipBg: string
  tooltipBorder: string
  /** Ordered accent series colors, derived from the design tokens. */
  palette: string[]
}

const FALLBACK: ChartTheme = {
  text: '#71717a',
  axis: '#e4e4e7',
  split: '#f1f1f4',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e4e4e7',
  palette: ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0ea5e9'],
}

function read(): ChartTheme {
  if (typeof window === 'undefined') return FALLBACK
  // The design tokens are oklch(), which ECharts can't parse. Resolve each
  // through a probe element so the browser hands back a computed rgb() string.
  const probe = document.createElement('span')
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  const g = (name: string, fallback: string) => {
    probe.style.color = `var(${name}, ${fallback})`
    return getComputedStyle(probe).color || fallback
  }
  const theme: ChartTheme = {
    text: g('--muted-foreground', FALLBACK.text),
    axis: g('--border', FALLBACK.axis),
    split: g('--border', FALLBACK.split),
    tooltipBg: g('--popover', FALLBACK.tooltipBg),
    tooltipBorder: g('--border', FALLBACK.tooltipBorder),
    palette: [
      g('--chart-1', FALLBACK.palette[0]),
      g('--chart-2', FALLBACK.palette[1]),
      g('--chart-3', FALLBACK.palette[2]),
      g('--chart-4', FALLBACK.palette[3]),
      g('--chart-5', FALLBACK.palette[4]),
    ],
  }
  probe.remove()
  return theme
}

/**
 * Reads chart colors from the app's CSS custom properties and re-reads them
 * whenever the theme changes (data-theme attribute or the OS colour scheme), so
 * ECharts stays in sync with light/dark without hard-coded hex values.
 */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = React.useState<ChartTheme>(FALLBACK)

  React.useEffect(() => {
    const apply = () => setTheme(read())
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    })
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', apply)
    }
  }, [])

  return theme
}
