import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartConfig, ChartContainer } from '@/components/ui/Chart';
import { getRevenueByCategory } from '@rufieltics/db';
import { RevenueByCategoryChartClient } from './RevenueByCategoryChartClient';

const chartConfig = {
  revenue: {
    label: 'Revenue'
  }
} satisfies ChartConfig;

export async function RevenueByCategoryChart() {
  try {
    const data = await getRevenueByCategory();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <p className='text-muted-foreground text-sm'>
            Business Insight: Which product categories drive the most revenue
          </p>
        </CardHeader>
        <CardContent className='pt-6'>
          <ChartContainer config={chartConfig} className='h-[350px] w-full'>
            <RevenueByCategoryChartClient data={data} />
          </ChartContainer>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('RevenueByCategoryChart: Error fetching data:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <p className='text-muted-foreground text-sm'>
            Business Insight: Which product categories drive the most revenue
          </p>
        </CardHeader>
        <CardContent>
          <div className='flex h-[350px] w-full items-center justify-center text-red-500'>
            Error loading chart:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }
}
