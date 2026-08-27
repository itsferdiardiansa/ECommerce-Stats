'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { resolveThemedColor } from '@/components/charts/utils'
import type {
  ChartSpinnerVariant,
  ChartLoadingSize,
  ChartThemedColor,
  ChartTheme,
} from '@/components/charts/utils'

export interface ChartLoadingProps {
  show: boolean
  variant?: ChartSpinnerVariant
  size?: ChartLoadingSize
  color?: ChartThemedColor
  mask?: ChartThemedColor
  className?: string
}

const DEFAULT_COLOR: Record<ChartTheme, string> = {
  light: 'var(--chart-ds-violet-bold, rgb(124, 58, 237))',
  dark: 'var(--chart-ds-violet-bold, rgb(167, 139, 250))',
}

// The same scrim token the Drawer's overlay uses — it already carries its own
// alpha and is defined per theme (a light veil on light, a dark one on dark).
const DEFAULT_MASK: Record<ChartTheme, string> = {
  light:
    'var(--background-color-ds-elevation-surface-overlay, rgba(255, 255, 255, 0.6))',
  dark: 'var(--background-color-ds-elevation-surface-overlay, rgba(82, 82, 82, 0.6))',
}

function useChartTheme(ref: React.RefObject<HTMLElement | null>): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>('light')

  useEffect(() => {
    if (typeof document === 'undefined') return

    const read = (): ChartTheme => {
      const scoped = ref.current?.closest('[data-theme]')
      const attr =
        scoped?.getAttribute('data-theme') ??
        document.documentElement.getAttribute('data-theme')
      if (attr === 'dark') return 'dark'
      if (attr === 'light') return 'light'
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }

    const apply = () => setTheme(read())
    apply()

    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-theme'],
    })
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    media?.addEventListener('change', apply)

    return () => {
      observer.disconnect()
      media?.removeEventListener('change', apply)
    }
  }, [ref])

  return theme
}

const KEYFRAMES = `
@keyframes clera-chart-spin { to { transform: rotate(360deg); } }
@keyframes clera-chart-dot { 0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
@keyframes clera-chart-bar { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
@keyframes clera-chart-pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1); opacity: 0; } }
`

const UNIT: Record<ChartLoadingSize, number> = { sm: 20, md: 32, lg: 44 }

/**
 * Sizing for the element ECharts renders into. It must stay a React leaf —
 * ECharts appends its own canvas there — so the loading overlay is mounted as
 * its sibling instead of inside it, or React's reconciler and ECharts fight
 * over the same children (`removeChild` crashes, overlay disappearing).
 */
export const CHART_SURFACE: CSSProperties = { width: '100%', height: '100%' }

const overlayStyle = (mask: string): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: mask,
  zIndex: 10,
})

function Spinner({ unit, color }: { unit: number; color: string }) {
  return (
    <span
      style={{
        width: unit,
        height: unit,
        borderRadius: '50%',
        border: `${Math.max(2, unit / 12)}px solid`,
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
        borderTopColor: color,
        animation: 'clera-chart-spin 0.7s linear infinite',
        boxSizing: 'border-box',
      }}
    />
  )
}

function Dots({ unit, color }: { unit: number; color: string }) {
  const dot = Math.max(5, unit / 3.5)
  return (
    <span style={{ display: 'inline-flex', gap: dot * 0.5 }}>
      {[0, 1, 2].map(item => (
        <span
          key={item}
          style={{
            width: dot,
            height: dot,
            borderRadius: '50%',
            backgroundColor: color,
            animation: 'clera-chart-dot 1.2s ease-in-out infinite',
            animationDelay: `${item * 0.16}s`,
          }}
        />
      ))}
    </span>
  )
}

function Bars({ unit, color }: { unit: number; color: string }) {
  const bar = Math.max(3, unit / 6)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: bar * 0.6,
        height: unit,
      }}
    >
      {[0, 1, 2, 3].map(item => (
        <span
          key={item}
          style={{
            width: bar,
            height: '100%',
            borderRadius: bar,
            backgroundColor: color,
            transformOrigin: 'center',
            animation: 'clera-chart-bar 1s ease-in-out infinite',
            animationDelay: `${item * 0.12}s`,
          }}
        />
      ))}
    </span>
  )
}

function Pulse({ unit, color }: { unit: number; color: string }) {
  return (
    <span style={{ position: 'relative', width: unit, height: unit }}>
      {[0, 1].map(item => (
        <span
          key={item}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: color,
            animation: 'clera-chart-pulse 1.4s ease-out infinite',
            animationDelay: `${item * 0.7}s`,
          }}
        />
      ))}
    </span>
  )
}

const SPINNERS: Record<
  ChartSpinnerVariant,
  React.FC<{ unit: number; color: string }>
> = {
  spinner: Spinner,
  dots: Dots,
  bars: Bars,
  pulse: Pulse,
}

export const ChartLoading: React.FC<ChartLoadingProps> = ({
  show,
  variant = 'spinner',
  size = 'md',
  color,
  mask,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const theme = useChartTheme(ref)

  if (!show) return null

  const unit = UNIT[size]
  const SpinnerImpl = SPINNERS[variant]
  const resolvedColor = resolveThemedColor(color, theme, DEFAULT_COLOR[theme])
  const resolvedMask = resolveThemedColor(mask, theme, DEFAULT_MASK[theme])

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      data-testid="chart-loading"
      className={className}
      style={overlayStyle(resolvedMask)}
    >
      <style>{KEYFRAMES}</style>
      <SpinnerImpl unit={unit} color={resolvedColor} />
    </div>
  )
}

ChartLoading.displayName = 'ChartLoading'
