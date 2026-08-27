'use client'

import type { LucideIcon } from 'lucide-react'
import { Card, SegmentedTabs } from '@rufieltics/ui'
import { GradientLine } from './GradientLine'

interface TrendTab {
  value: string
  label: string
}

export interface TrendChartCardProps {
  title: string
  icon?: LucideIcon
  categories: (string | number)[]
  data: number[]
  name?: string
  formatValue?: (value: number) => string
  height?: number
  tabs?: TrendTab[]
  tabValue?: string
  onTabChange?: (value: string) => void
}

export function TrendChartCard({
  title,
  icon,
  categories,
  data,
  name,
  formatValue,
  height,
  tabs,
  tabValue,
  onTabChange,
}: TrendChartCardProps) {
  const action =
    tabs && tabValue !== undefined && onTabChange ? (
      <SegmentedTabs
        value={tabValue}
        onChange={onTabChange}
        options={tabs}
        ariaLabel={title}
      />
    ) : undefined

  return (
    <Card bordered={false}>
      <Card.Header title={title} icon={icon} action={action} />
      <Card.Content>
        <GradientLine
          categories={categories}
          data={data}
          name={name}
          formatValue={formatValue}
          height={height}
        />
      </Card.Content>
    </Card>
  )
}
