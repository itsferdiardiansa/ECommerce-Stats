'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { RevenueByCategoryRow } from '@rufieltics/db'

const BAR_FILL = 'var(--primary)'

interface RevenueByCategoryChartClientProps {
  data: RevenueByCategoryRow[]
}

export function RevenueByCategoryChartClient({
  data,
}: RevenueByCategoryChartClientProps) {
  const sortedData = data.sort((a, b) => b.revenue - a.revenue).slice(0, 6)

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[350px] items-center justify-center">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={sortedData}
        margin={{ top: 12, right: 12, left: 12, bottom: 12 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={true}
          stroke="var(--border)"
        />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          fontSize={12}
          tick={{ fill: 'hsl(var(--foreground))' }}
        />
        <YAxis
          dataKey="category"
          type="category"
          axisLine={false}
          tickLine={false}
          fontSize={12}
          width={160}
          tick={{ fill: 'hsl(var(--foreground))' }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="revenue"
          radius={[6, 6, 6, 6]}
          fill={BAR_FILL}
          barSize={22}
        >
          {sortedData.map(entry => (
            <Cell key={entry.category} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
