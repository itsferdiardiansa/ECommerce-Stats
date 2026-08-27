import type { EChartEventParams } from '@/components/charts/hooks'
import type { RadarSeriesClick } from './types'

export function resolveSeriesClick(
  params: EChartEventParams
): RadarSeriesClick {
  return {
    name: params.name ?? '',
    values: Array.isArray(params.value) ? (params.value as number[]) : [],
    index: params.dataIndex ?? -1,
  }
}
