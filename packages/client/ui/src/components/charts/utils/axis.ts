/**
 * Escape hatch for customizing an axis's labels — for example, rendering rich
 * labels with icons/images (the "YouTube icon on the x-axis" case).
 *
 * `formatter` is the render function: return plain text, or ECharts rich-text
 * markup (e.g. `` `{yt|}  ${name}` ``) and define the referenced style blocks in
 * `rich`. Put an icon in a block with `backgroundColor: { image: url }`.
 *
 * These fields map straight onto ECharts' `axisLabel`, so anything valid there
 * works; the listed ones are the common knobs.
 */
export type AxisLabelOverride = {
  formatter?: (value: string | number, index: number) => string
  rich?: Record<string, Record<string, unknown>>
  margin?: number
  color?: string
  fontSize?: number
  fontWeight?: number | string
  rotate?: number
  interval?: number | 'auto'
  hideOverlap?: boolean
  width?: number
  overflow?: 'none' | 'truncate' | 'break' | 'breakAll'
}

/** Which side a vertical value axis sits on. */
export type ValueAxisPosition = 'left' | 'right'

/** Where the value-axis title sits along the axis. */
export type ValueAxisNamePosition = 'top' | 'middle' | 'bottom'

/** Where the category-axis title sits along the axis. */
export type CategoryAxisNamePosition = 'left' | 'middle' | 'right'

export type AxisNamePosition = ValueAxisNamePosition | CategoryAxisNamePosition

/** How the title text reads: upright (`horizontal`) or rotated 90° (`vertical`). */
export type AxisNameOrientation = 'horizontal' | 'vertical'

export interface AxisNameOptions {
  /** The axis's real on-screen orientation. */
  orientation: 'vertical' | 'horizontal'
  /** Which side a vertical axis sits on — affects title alignment. */
  side?: 'left' | 'right'
  /** Whether the axis is inverted (flips the top/bottom, i.e. start/end, ends). */
  inverse?: boolean
  /**
   * Space (px) between the axis line and where a centered (`middle`) title
   * should sit: the tick-label extent, plus the zoom slider for a bottom axis.
   * The caller owns this so the title clears its own labels and zoom indicator.
   */
  labelExtent?: number
  /**
   * Force the title's text rotation. When omitted it defaults to `vertical` for
   * a `middle` title on a vertical axis, and `horizontal` everywhere else.
   */
  rotation?: AxisNameOrientation
  /** Estimated title width (px) — used to reserve gutter for an upright title. */
  nameWidth?: number
}

export interface AxisNamePlacement {
  nameLocation: 'start' | 'middle' | 'end'
  nameRotate: number
  nameGap: number
  nameTextStyle: Record<string, unknown>
  /** Gutter (px) the title needs, and on which side, so callers can grow the grid. */
  reserve: number
  reserveSide: 'left' | 'right' | 'top' | 'bottom'
}

const TO_LOCATION: Record<AxisNamePosition, 'start' | 'middle' | 'end'> = {
  top: 'end',
  right: 'end',
  bottom: 'start',
  left: 'start',
  middle: 'middle',
}

/** Approx. title text height in px, for gutter reservations. */
const TITLE_H = 16

/**
 * Translate a friendly, role-relative title position (`top`/`middle`/`bottom`
 * for value axes, `left`/`middle`/`right` for category axes) into the ECharts
 * `name*` props, resolving orientation and `inverse`. Also reports how much
 * gutter the title needs and where, so callers can size the grid to avoid
 * overlapping the tick labels or the zoom slider.
 */
export function resolveAxisName(
  position: AxisNamePosition,
  opts: AxisNameOptions
): AxisNamePlacement {
  const {
    orientation,
    side = 'left',
    inverse = false,
    labelExtent = 40,
    rotation,
    nameWidth = 60,
  } = opts
  let location = TO_LOCATION[position]
  if (inverse && location !== 'middle') {
    location = location === 'start' ? 'end' : 'start'
  }

  const axisVertical = orientation === 'vertical'
  const isVertical =
    rotation === 'vertical'
      ? true
      : rotation === 'horizontal'
        ? false
        : location === 'middle' && axisVertical
  const nameRotate = isVertical ? 90 : 0
  const half = Math.ceil((isVertical ? TITLE_H : nameWidth) / 2)

  if (location === 'middle') {
    if (axisVertical) {
      const gap = labelExtent + half + 8
      return {
        nameLocation: 'middle',
        nameRotate,
        nameGap: gap,
        nameTextStyle: { align: 'center' },
        reserve: gap + half + 6,
        reserveSide: side,
      }
    }
    const depth = isVertical ? nameWidth : TITLE_H
    const gap = labelExtent + Math.ceil(depth / 2) + 4
    return {
      nameLocation: 'middle',
      nameRotate,
      nameGap: gap,
      nameTextStyle: { align: 'center' },
      reserve: gap + Math.ceil(depth / 2) + 6,
      reserveSide: 'bottom',
    }
  }

  const cornerReserve = isVertical ? nameWidth + 8 : TITLE_H + 6
  if (axisVertical) {
    const atTop = location === 'end'
    return {
      nameLocation: location,
      nameRotate,
      nameGap: 15,
      nameTextStyle: {},
      reserve: cornerReserve,
      reserveSide: atTop ? 'top' : 'bottom',
    }
  }
  const upright = !isVertical
  const atEnd = location === 'end'
  return {
    nameLocation: location,
    nameRotate,
    nameGap: upright ? 16 : 15,
    nameTextStyle: upright
      ? {
          align: atEnd ? 'left' : 'right',
          verticalAlign: 'top',
          padding: [8, 0, 0, 0],
        }
      : {},
    reserve: upright ? labelExtent + TITLE_H + 6 : cornerReserve,
    reserveSide: 'bottom',
  }
}
