import { lighten, withAlpha } from './colors'

export interface ItemHighlightState {
  emphasis: Record<string, unknown>
  blur?: Record<string, unknown>
}

export interface SelfHighlightOptions {
  enabled: boolean
  blurOpacity?: number
  /**
   * Grow the hovered item. Off by default: for symbol/line/area shapes,
   * scaling moves the hit area out from under the cursor, which fires
   * `mouseout` -> shrink -> `mouseover` in a loop — the hover (and the
   * cursor) flickers. Only safe for shapes that grow around the cursor,
   * e.g. a pie slice.
   */
  scale?: boolean
  scaleSize?: number
}

/**
 * Series-level `emphasis`/`blur` for charts where each *data item* is a group
 * rather than each series — the radar/pie shape, where the legend and hover
 * target data items (`focus: 'self'`) instead of whole series.
 *
 * Like the other builders, hovering always gives an affordance; `enabled` only
 * decides whether the *other* items are dimmed too.
 *
 * `scale` stays off by default because scaling can move a symbol out from
 * under the cursor, which fires `mouseout` -> `mouseover` in a loop and makes
 * the hover (and the cursor) flicker. Callers must also state any hover
 * geometry explicitly rather than let ECharts' default emphasis apply: see
 * `buildSelfHoverStyle`, which only ever *grows* the stroke, so the hit area
 * expands around the cursor instead of shifting away from it.
 */
export function buildSelfHighlight({
  enabled,
  blurOpacity = 0.15,
  scale = false,
  scaleSize,
}: SelfHighlightOptions): ItemHighlightState {
  return {
    emphasis: {
      scale,
      ...(scale && scaleSize !== undefined ? { scaleSize } : {}),
      focus: enabled ? 'self' : 'none',
      ...(enabled ? { blurScope: 'series' } : {}),
    },
    ...(enabled
      ? {
          blur: {
            lineStyle: { opacity: blurOpacity },
            itemStyle: { opacity: blurOpacity },
            areaStyle: { opacity: blurOpacity * 0.4 },
          },
        }
      : {}),
  }
}

export interface SelfHoverStyleOptions {
  /** The item's resting line width. Hover grows it by `boldBy`. */
  lineWidth: number
  /** Extra px of stroke on hover. Growing only ever expands the hit area. */
  boldBy?: number
  /** Fill opacity on hover. Omit for items with no area. */
  areaOpacity?: number
}

/**
 * The per-item hover style to pair with `buildSelfHighlight`: a lighter fill
 * and a bolder line, with every changed value stated explicitly so ECharts'
 * default emphasis (which resizes shapes unpredictably) never applies.
 */
export function buildSelfHoverStyle(
  color: string,
  { lineWidth, boldBy = 1, areaOpacity }: SelfHoverStyleOptions
): Record<string, unknown> {
  const hover = lighten(color)
  return {
    lineStyle: { color: hover, width: lineWidth + boldBy },
    itemStyle: { color: hover },
    ...(areaOpacity !== undefined
      ? { areaStyle: { color: withAlpha(hover, areaOpacity) } }
      : {}),
  }
}

/**
 * `emphasis`/`blur` pair for solid-fill series (bar segments, polar-bar
 * segments): hovering lightens that item always; when `enabled`, it also
 * dims every other series (`focus: 'series'`) instead of leaving them alone.
 *
 * `alwaysFocusSeries` keeps `focus: 'series'` set even when `enabled` is
 * false, so hovering any part of a multi-point series (e.g. Combo's bars)
 * still highlights the whole series — only the dimming of *other* series is
 * gated by `enabled`.
 */
export function buildItemHighlight(
  color: string,
  enabled: boolean,
  blurOpacity = 0.2,
  alwaysFocusSeries = false
): ItemHighlightState {
  return {
    emphasis:
      enabled || alwaysFocusSeries
        ? { focus: 'series', itemStyle: { color: lighten(color) } }
        : { itemStyle: { color: lighten(color) } },
    ...(enabled ? { blur: { itemStyle: { opacity: blurOpacity } } } : {}),
  }
}

export interface LineHighlightAreaOptions {
  /** `areaStyle` applied to the hovered series itself. */
  emphasis: Record<string, unknown>
  /** Fill opacity for other series' areas while one is highlighted. */
  blurOpacity?: number
}

export interface LineHighlightOptions {
  /** Preserve the line's own width on hover (ECharts doesn't inherit it). */
  width?: number
  enabled: boolean
  /** Disables emphasis/blur entirely (e.g. a threshold reference line). */
  disabled?: boolean
  blurOpacity?: number
  area?: LineHighlightAreaOptions
  /**
   * Keeps `focus: 'series'` set even when `enabled` is false, so hovering
   * any point still highlights the whole line — only the dimming of other
   * series is gated by `enabled`. Off by default (focus follows `enabled`).
   */
  alwaysFocusSeries?: boolean
}

/**
 * `emphasis`/`blur` pair for line/area series (Line, Combo's line/area
 * series, MultiXLine): the hovered line always lightens; when `enabled`, it
 * also dims every other series instead of leaving them alone.
 */
export function buildLineHighlight(
  color: string,
  {
    width,
    enabled,
    disabled,
    blurOpacity = 0.2,
    area,
    alwaysFocusSeries = false,
  }: LineHighlightOptions
): ItemHighlightState {
  if (disabled) return { emphasis: { disabled: true } }
  const hover = lighten(color)
  return {
    emphasis: {
      focus: enabled || alwaysFocusSeries ? 'series' : 'none',
      lineStyle: { color: hover, ...(width !== undefined ? { width } : {}) },
      itemStyle: { color: hover },
      ...(area ? { areaStyle: area.emphasis } : {}),
    },
    ...(enabled
      ? {
          blur: {
            lineStyle: { opacity: blurOpacity },
            itemStyle: { opacity: blurOpacity },
            ...(area
              ? { areaStyle: { opacity: area.blurOpacity ?? blurOpacity } }
              : {}),
          },
        }
      : {}),
  }
}
