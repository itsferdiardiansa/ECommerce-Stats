import type { EChartEventParams } from '@/components/charts/hooks'
import type { ScatterPointClick } from './types'

export function resolvePoint(params: EChartEventParams): ScatterPointClick {
  const value = params.value
  const [x, y] = Array.isArray(value) ? value : [0, 0]
  return {
    seriesName: params.seriesName ?? '',
    x: Number(x),
    y: Number(y),
    index: params.dataIndex ?? -1,
  }
}
