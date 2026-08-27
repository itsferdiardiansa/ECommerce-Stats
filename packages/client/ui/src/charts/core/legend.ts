export type LegendMarkerShape = 'rectangle' | 'square' | 'circle'
export type LegendMarkerSize = 'xs' | 'sm' | 'md'

export interface LegendMarker {
  shape?: LegendMarkerShape
  /** Applies to square + circle; rectangles use it as their height. */
  size?: LegendMarkerSize
}

const MARKER_SIZE: Record<LegendMarkerSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
}

/** Maps a semantic legend marker to ECharts `icon` + item dimensions. */
export function legendMarkerStyle(marker?: LegendMarker) {
  const shape = marker?.shape ?? 'square'
  const size = MARKER_SIZE[marker?.size ?? 'sm']

  if (shape === 'circle') {
    return { icon: 'circle', itemWidth: size, itemHeight: size }
  }
  if (shape === 'rectangle') {
    return { icon: 'roundRect', itemWidth: size * 2, itemHeight: size }
  }
  return { icon: 'roundRect', itemWidth: size, itemHeight: size }
}
