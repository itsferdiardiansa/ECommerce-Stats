import type { ReactElement } from 'react'
import type { renderToStaticMarkup as RenderToStaticMarkup } from 'react-dom/server'
import type { ECharts } from 'echarts/core'

declare const require: (id: string) => unknown

let renderToStaticMarkupRef: typeof RenderToStaticMarkup | undefined
function getRenderToStaticMarkup(): typeof RenderToStaticMarkup {
  renderToStaticMarkupRef ??= (
    require('react-dom/server') as typeof import('react-dom/server')
  ).renderToStaticMarkup
  return renderToStaticMarkupRef
}

/** Which edge or corner of the chart the legend sits on. */
export type LegendPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type LegendAlign = 'start' | 'center' | 'end'

export function legendReserveSide(
  position: LegendPosition
): 'top' | 'bottom' | 'left' | 'right' {
  if (position === 'left' || position === 'right') return position
  if (position === 'top' || position === 'top-left' || position === 'top-right')
    return 'top'
  return 'bottom'
}

/** ECharts' built-in legend marker shapes. */
export type LegendIconShape =
  | 'circle'
  | 'square'
  | 'rect'
  | 'roundRect'
  | 'triangle'
  | 'diamond'
  | 'pin'
  | 'arrow'
  | 'none'

/**
 * Marker for each legend entry: one of the built-in shapes, a `path://…` /
 * `image://…` string, a raw `<svg>` string, an image URL (png/jpg/etc.), or
 * a React element — from react-icons, lucide, or any other icon library, or
 * a plain inline `<svg>`. React elements are rendered to a static SVG string
 * and embedded as a data URI, so any icon component works.
 */
export type LegendIcon = LegendIconShape | (string & {}) | ReactElement

const RAW_SVG_RE = /^\s*<svg[\s>]/i
const IMAGE_URL_RE = /^(https?:|data:|\/)/i
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i

// ECharts' native 'pin'/'arrow' legend symbols are drawn from a directional
// anchor point (the pin's tip, the arrow's head) rather than a bounding-box
// center, so they render off-center against the legend text. These paths
// describe the same shapes in plain coordinates; ECharts fits an arbitrary
// `path://` to its target box the same way it fits `rect`/`circle`, which
// keeps them vertically centered.
const PIN_PATH =
  'path://M12 2C8.13 2 5 5.24 5 9.5 5 15.5 12 22 12 22S19 15.5 19 9.5C19 5.24 15.87 2 12 2ZM12 12A2.5 2.5 0 1 1 12 7A2.5 2.5 0 0 1 12 12Z'
const ARROW_PATH = 'path://M12 2L28 22L12 17L-4 22Z'

function svgToIconUri(svg: string): string {
  return `image://data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Turns a `LegendIcon` into the string ECharts' `legend.icon` expects. */
export function resolveLegendIcon(icon: LegendIcon): string {
  if (typeof icon !== 'string') {
    return svgToIconUri(getRenderToStaticMarkup()(icon))
  }
  if (icon === 'pin') return PIN_PATH
  if (icon === 'arrow') return ARROW_PATH
  if (icon.startsWith('path://') || icon.startsWith('image://')) return icon
  if (RAW_SVG_RE.test(icon)) return svgToIconUri(icon)
  if (IMAGE_URL_RE.test(icon) || IMAGE_EXT_RE.test(icon))
    return `image://${icon}`
  return icon
}

const NAMED_SHAPES = new Set<LegendIconShape>([
  'circle',
  'square',
  'rect',
  'roundRect',
  'triangle',
  'diamond',
  'pin',
  'arrow',
  'none',
])

function isNamedShape(icon: LegendIcon): icon is LegendIconShape {
  return typeof icon === 'string' && NAMED_SHAPES.has(icon as LegendIconShape)
}

/** Sizing for ECharts' built-in shape vocabulary — `rect`/`roundRect` get a
 * wider-than-tall box; `square` is forced to equal width/height. */
function resolveShapeItemSize(
  shape: LegendIconShape,
  style?: LegendStyleOverrides
): [number, number] {
  const [defaultWidth, defaultHeight] =
    shape === 'rect' || shape === 'roundRect' ? [16, 8] : [10, 10]
  const width = style?.itemWidth ?? defaultWidth
  const height = style?.itemHeight ?? defaultHeight
  if (shape === 'square') {
    const size = Math.min(width, height)
    return [size, size]
  }
  return [width, height]
}

/** Sizing for custom icons (React elements, inline SVG, images, arbitrary
 * `path://`/`image://` strings) — logos/artwork, not geometric shapes, so
 * they get their own default box rather than sharing the shape defaults. */
function resolveCustomIconItemSize(
  style?: LegendStyleOverrides
): [number, number] {
  return [style?.itemWidth ?? 14, style?.itemHeight ?? 14]
}

function resolveItemSize(
  icon: LegendIcon,
  style?: LegendStyleOverrides
): [number, number] {
  return isNamedShape(icon)
    ? resolveShapeItemSize(icon, style)
    : resolveCustomIconItemSize(style)
}

/** Fine-grained legend styling, layered on top of the design-system defaults. */
export interface LegendStyleOverrides {
  itemWidth?: number
  itemHeight?: number
  itemGap?: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number
  textColor?: string
  inactiveColor?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number | number[]
}

export interface BaseLegendProps {
  /** Show or hide the legend. */
  showLegend?: boolean
  /** Which edge of the chart the legend sits on. */
  legendPosition?: LegendPosition
  /** Marker for each legend entry: a built-in shape, a custom icon string, or a React element (e.g. a react-icons icon). */
  legendIcon?: LegendIcon
  /** Where along that edge the legend sits (default `center`). */
  legendAlign?: LegendAlign
  /** Fine-grained legend styling (colors, sizing, background, border). */
  legendStyle?: LegendStyleOverrides
}

/** A legend entry, or a name with its own icon override. */
export type LegendDataItem = string | { name: string; icon: LegendIcon }

export interface BuildLegendOptionParams {
  shown: boolean
  data?: LegendDataItem[]
  position: LegendPosition
  icon?: LegendIcon
  align?: LegendAlign
  /** Extra px offset applied only when the legend is pinned `top`. */
  topOffset?: number
  /** Renders as a paging `scroll` legend instead of wrapping (`plain`). */
  scrollable?: boolean
  /**
   * Reserved px width for a `left`/`right` legend — caps it and truncates
   * long labels so it can't grow past the space the caller has for it.
   */
  sideWidth?: number
  colors: { label: string; subtle: string; line: string }
  style?: LegendStyleOverrides
}

interface LegendPlacement {
  orient: 'horizontal' | 'vertical'
  top?: number | string
  bottom?: number | string
  left?: number | string
  right?: number | string
}

/** Resolves a `LegendPosition` (edge or corner) + `align` into ECharts
 * `orient` / `top` / `bottom` / `left` / `right`. Corners pin to their vertical
 * edge + side; edges use `align` along the edge. The chart reserves grid space
 * for both via `legendReserveSide`. */
function resolveLegendPlacement(
  position: LegendPosition,
  align: LegendAlign,
  topOffset: number
): LegendPlacement {
  if (position.includes('-')) {
    const [v, h] = position.split('-') as ['top' | 'bottom', 'left' | 'right']
    return {
      orient: 'horizontal',
      top: v === 'top' ? topOffset : undefined,
      bottom: v === 'bottom' ? 0 : undefined,
      left: h === 'left' ? 0 : undefined,
      right: h === 'right' ? 0 : undefined,
    }
  }

  if (position === 'left' || position === 'right') {
    return {
      orient: 'vertical',
      left: position === 'left' ? 0 : undefined,
      right: position === 'right' ? 0 : undefined,
      top: align === 'start' ? 0 : align === 'end' ? undefined : 'middle',
      bottom: align === 'end' ? 0 : undefined,
    }
  }

  return {
    orient: 'horizontal',
    top: position === 'bottom' ? undefined : topOffset,
    bottom: position === 'bottom' ? 0 : undefined,
    left: align === 'start' ? 0 : align === 'end' ? undefined : 'center',
    right: align === 'end' ? 0 : undefined,
  }
}

/**
 * Builds an ECharts `legend` option shared by every chart type: position,
 * cross-axis alignment, icon shape, and style overrides all resolve the same
 * way everywhere, so each chart only supplies its own data/scroll/sizing
 * quirks instead of re-deriving this layout math.
 */
export function buildLegendOption({
  shown,
  data,
  position,
  icon = 'roundRect',
  align = 'center',
  topOffset = 0,
  scrollable,
  sideWidth,
  colors,
  style,
}: BuildLegendOptionParams): Record<string, unknown> {
  const placement = resolveLegendPlacement(position, align, topOffset)
  const vertical = placement.orient === 'vertical'
  // ECharts' itemWidth/itemHeight are one shared box for every entry — icon
  // is the only thing that's truly per-item. So if any series brings its own
  // custom icon, the whole legend uses the custom-icon box size instead of
  // whatever the chart-level shape wants, or switching that shape (e.g.
  // roundRect → rect) would restretch every custom icon into a differently
  // shaped box even though its own icon never changed.
  const hasCustomIcon = Boolean(data?.some(item => typeof item !== 'string'))
  const [itemWidth, itemHeight] = hasCustomIcon
    ? resolveCustomIconItemSize(style)
    : resolveItemSize(icon, style)
  const resolvedIcon = resolveLegendIcon(icon)
  // Custom path://‌/image:// icons (react-icons, raw SVG, images, our
  // hand-authored pin/arrow paths) get stretched to exactly fill the box
  // by default, distorting non-square icons — keep their own aspect instead.
  // Built-in named shapes (circle/rect/roundRect/...) are unaffected by this
  // flag: they have no "natural aspect" of their own to preserve.
  const keepAspect =
    resolvedIcon.startsWith('path://') || resolvedIcon.startsWith('image://')

  return {
    show: shown,
    ...(scrollable !== undefined
      ? { type: scrollable ? 'scroll' : 'plain' }
      : {}),
    ...(data
      ? {
          data: data.map(item => {
            if (typeof item === 'string') return item
            const itemIcon = resolveLegendIcon(item.icon)
            return {
              name: item.name,
              icon: itemIcon,
              symbolKeepAspect:
                itemIcon.startsWith('path://') ||
                itemIcon.startsWith('image://'),
            }
          }),
        }
      : {}),
    orient: placement.orient,
    top: placement.top,
    bottom: placement.bottom,
    left: placement.left,
    right: placement.right,
    ...(vertical && sideWidth ? { width: sideWidth - 8 } : {}),
    icon: resolvedIcon,
    symbolKeepAspect: keepAspect,
    itemWidth,
    itemHeight,
    itemGap: style?.itemGap ?? 12,
    textStyle: {
      color: style?.textColor ?? colors.label,
      fontSize: style?.fontSize ?? 12,
      ...(style?.fontWeight !== undefined
        ? { fontWeight: style.fontWeight }
        : {}),
      ...(vertical && sideWidth
        ? { width: sideWidth - 26, overflow: 'truncate' as const }
        : {}),
    },
    ...(scrollable
      ? {
          pageIconColor: colors.subtle,
          pageIconInactiveColor: colors.line,
          pageTextStyle: { color: colors.subtle },
        }
      : {}),
    inactiveColor: style?.inactiveColor ?? toInactiveColor(),
    ...(style?.backgroundColor
      ? { backgroundColor: style.backgroundColor }
      : {}),
    ...(style?.borderColor ? { borderColor: style.borderColor } : {}),
    ...(style?.borderWidth !== undefined
      ? { borderWidth: style.borderWidth }
      : {}),
    ...(style?.borderRadius !== undefined
      ? { borderRadius: style.borderRadius }
      : {}),
    ...(style?.padding !== undefined ? { padding: style.padding } : {}),
  }
}

function toInactiveColor(opacity = 0.4): string {
  return `rgba(128, 128, 128, ${opacity})`
}

const CUSTOM_ICON_RE = /^(?:path|image):\/\//

type LegendDataOption = {
  name?: string
  icon?: string
  itemStyle?: Record<string, unknown>
}

/**
 * Deselecting a legend entry normally dims its icon via `inactiveColor`, but
 * that's a fill/stroke recolor — a no-op for `path://`/`image://` icons (a
 * bitmap/SVG has no "fill" to recolor). Wire this to the chart's own
 * `legendselectchanged` event to fade custom icons via opacity instead, so
 * they still visibly go inactive along with their label.
 */
export function syncCustomLegendIconOpacity(
  chart: ECharts,
  selected: Record<string, boolean>
): void {
  const legends = (chart.getOption() as { legend?: unknown[] }).legend
  if (!Array.isArray(legends) || legends.length === 0) return

  let changed = false
  const nextLegends = legends.map(legend => {
    const data = (legend as { data?: unknown[] }).data
    if (!Array.isArray(data)) return legend
    const nextData = data.map(item => {
      const entry = item as LegendDataOption
      if (typeof entry !== 'object' || !CUSTOM_ICON_RE.test(entry.icon ?? ''))
        return item
      changed = true
      const isSelected = entry.name == null || selected[entry.name] !== false
      return {
        ...entry,
        itemStyle: { ...entry.itemStyle, opacity: isSelected ? 1 : 0.35 },
      }
    })
    return { ...(legend as object), data: nextData }
  })

  if (changed) chart.setOption({ legend: nextLegends })
}
