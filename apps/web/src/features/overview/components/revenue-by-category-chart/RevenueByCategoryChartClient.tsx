'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';

import { ChartTooltip, ChartTooltipContent } from '@/components/ui/Chart';
import type { RevenueByCategoryRow } from '@rufieltics/db';

const BAR_FILL = 'var(--primary)';

interface RevenueByCategoryChartClientProps {
  data: RevenueByCategoryRow[];
}

export function RevenueByCategoryChartClient({
  data
}: RevenueByCategoryChartClientProps) {
  const sortedData = data.sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className='text-muted-foreground flex h-[350px] items-center justify-center'>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <BarChart
        data={sortedData}
        margin={{ top: 12, right: 8, left: 0, bottom: 64 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke='var(--border)'
        />
        <XAxis
          dataKey='category'
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor='end'
          height={64}
          fontSize={12}
          tick={{ fill: 'hsl(var(--foreground))' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          fontSize={11}
          width={80}
          tick={{ fill: 'hsl(var(--foreground))' }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey='revenue'
          radius={[6, 6, 0, 0]}
          fill={BAR_FILL}
          barSize={34}
        >
          {sortedData.map((entry) => (
            <Cell key={entry.category} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
