'use client'

import * as React from 'react'
import { Cell, Label, Pie, PieChart, ResponsiveContainer } from 'recharts'

import {
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  ORDER_STATUS_COLORS,
  type PieGraphDatum,
} from '../../constants/orderStatus'

type PieGraphClientProps = {
  data: PieGraphDatum[]
  totalOrders: number
}

export default function PieGraphClient({
  data,
  totalOrders,
}: PieGraphClientProps) {
  const hasOrders = React.useMemo(
    () => data.some(segment => segment.value > 0),
    [data]
  )

  if (!hasOrders) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        No order activity yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={4}
          stroke="var(--background)"
          strokeWidth={2}
        >
          {data.map(segment => (
            <Cell key={segment.name} fill={ORDER_STATUS_COLORS[segment.name]} />
          ))}
          <Label
            position="center"
            className="text-foreground text-center font-semibold"
            value={`${totalOrders.toLocaleString()} orders`}
          />
        </Pie>
        <ChartLegend verticalAlign="bottom" />
      </PieChart>
    </ResponsiveContainer>
  )
}
