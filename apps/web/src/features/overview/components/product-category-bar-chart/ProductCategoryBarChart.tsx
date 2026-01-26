import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartConfig, ChartContainer } from '@/components/ui/Chart';
import BarGraphClient from './ProductCategoryBarChartClient';
import { getProductCountByCategory } from '@rufieltics/db';

const chartConfig = {
  count: {
    label: 'Products'
  }
} satisfies ChartConfig;

export type BarGraphDatum = {
  category: string;
  count: number;
};

export async function ProductCategoryBarChart() {
  const result = await getProductCountByCategory();

  const chartData: BarGraphDatum[] = result
    .map((row) => ({
      category: row.category || 'Uncategorized',
      count: row.count
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch gap-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-4 px-6 pt-2 pb-6'>
          <CardTitle>Products by Category</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='h-[280px] min-h-[260px] w-full'
        >
          <BarGraphClient data={chartData} />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const BarGraph = ProductCategoryBarChart;

export default ProductCategoryBarChart;
