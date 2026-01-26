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
import { BarGraphDatum } from './ProductCategoryBarChart'

const BAR_FILL = 'var(--primary)'

type BarGraphClientProps = {
  data: BarGraphDatum[]
}

export default function BarGraphClient({ data }: BarGraphClientProps) {
  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        No product data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 12 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="category"
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={64}
        />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={BAR_FILL} barSize={34}>
          {data.map(entry => (
            <Cell key={entry.category} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
