'use client'

import { useState, useCallback } from 'react'
import type { BarDatum } from './types'

export type BarDrilldownDatum = BarDatum & {
  children?: BarDrilldownDatum[]
}

type Level = {
  label: string
  data: BarDrilldownDatum[]
}

export interface UseBarDrilldownResult {
  /** The bars for the current level — pass straight to `Bar`'s `data`. */
  data: BarDrilldownDatum[]
  /** Labels from the root down to the current level (for a breadcrumb). */
  path: string[]
  /** How many levels deep we are (0 = root). */
  depth: number
  /** Whether there is a level to go back up to. */
  canDrillUp: boolean
  /** Wire to `Bar`'s `onBarClick` — drills in when the bar has children. */
  onBarClick: (datum: BarDatum) => void
  /** Go up one level. */
  back: () => void
  /** Jump to a level by its index in `path` (breadcrumb click). */
  drillTo: (index: number) => void
  /** Return to the root level. */
  reset: () => void
}

/**
 * Drives single- or multi-level drilldown for a `Bar` chart from a tree of
 * data. The chart stays declarative — this hook just swaps which level's `data`
 * is shown and exposes a breadcrumb `path`. Clicking a bar with `children`
 * drills in; leaves do nothing.
 *
 * Note: `root` is read once on mount. If it can change, give the consuming
 * component a `key` to remount.
 */
export function useBarDrilldown(
  root: BarDrilldownDatum[],
  rootLabel = 'All'
): UseBarDrilldownResult {
  const [stack, setStack] = useState<Level[]>([
    { label: rootLabel, data: root },
  ])

  const onBarClick = useCallback((datum: BarDatum) => {
    setStack(prev => {
      const level = prev[prev.length - 1]
      const node = level.data.find(item => item.label === datum.label)
      if (!node?.children?.length) return prev
      const children = node.children.map(child => ({
        ...child,
        variant: child.variant ?? node.variant,
        color: child.color ?? node.color,
      }))
      return [...prev, { label: datum.label, data: children }]
    })
  }, [])

  const back = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const drillTo = useCallback((index: number) => {
    setStack(prev =>
      index >= 0 && index < prev.length ? prev.slice(0, index + 1) : prev
    )
  }, [])

  const reset = useCallback(() => {
    setStack(prev => prev.slice(0, 1))
  }, [])

  const current = stack[stack.length - 1]

  return {
    data: current.data,
    path: stack.map(level => level.label),
    depth: stack.length - 1,
    canDrillUp: stack.length > 1,
    onBarClick,
    back,
    drillTo,
    reset,
  }
}
