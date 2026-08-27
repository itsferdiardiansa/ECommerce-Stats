'use client'

import { Line } from '@rufieltics/ui/charts-lib'
import { usePrimaryColor } from '@/hooks/usePrimaryColor'

export interface GradientLineProps {
  categories: (string | number)[]
  data: number[]
  name?: string
  formatValue?: (value: number) => string
  height?: number
  showValueAxis?: boolean
}

export function GradientLine({
  categories,
  data,
  name = 'Value',
  formatValue,
  height = 320,
  showValueAxis = true,
}: GradientLineProps) {
  const primary = usePrimaryColor()

  return (
    <Line
      categories={categories}
      series={[{ name, data, color: primary, area: 'gradient' }]}
      height={height}
      curve="straight"
      showSymbol={false}
      lineWidth={2}
      showValueAxis={showValueAxis}
      showLegend={false}
      formatValue={formatValue}
    />
  )
}
