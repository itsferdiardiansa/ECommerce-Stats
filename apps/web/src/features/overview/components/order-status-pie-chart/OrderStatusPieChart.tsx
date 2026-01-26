import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/Card';
import { ChartConfig, ChartContainer } from '@/components/ui/Chart';
import { formatNumber } from '@/lib/format';
import { getOrderCountByStatus } from '@rufieltics/db';
import PieGraphClient from './OrderStatusPieChartClient';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
  type OrderStatusValue,
  type PieGraphDatum
} from '../../constants/orderStatus';

const chartConfig = {
  value: {
    label: 'Orders'
  },
  Processing: {
    label: ORDER_STATUS_LABELS.Processing,
    color: ORDER_STATUS_COLORS.Processing
  },
  Shipped: {
    label: ORDER_STATUS_LABELS.Shipped,
    color: ORDER_STATUS_COLORS.Shipped
  },
  Delivered: {
    label: ORDER_STATUS_LABELS.Delivered,
    color: ORDER_STATUS_COLORS.Delivered
  },
  Cancelled: {
    label: ORDER_STATUS_LABELS.Cancelled,
    color: ORDER_STATUS_COLORS.Cancelled
  },
  Unknown: {
    label: ORDER_STATUS_LABELS.Unknown,
    color: ORDER_STATUS_COLORS.Unknown
  }
} satisfies ChartConfig;

export async function OrderStatusPieChart() {
  const result = await getOrderCountByStatus();

  const statusTotals = ORDER_STATUS_VALUES.reduce(
    (acc, status) => ({
      ...acc,
      [status]: 0
    }),
    {} as Record<OrderStatusValue, number>
  );

  result.forEach((row) => {
    statusTotals[row.status as OrderStatusValue] = row.count;
  });

  const chartData: PieGraphDatum[] = ORDER_STATUS_VALUES.map((status) => ({
    name: status,
    value: statusTotals[status]
  })).filter((d) => d.value > 0);

  const totalOrders = chartData.reduce((sum, datum) => sum + datum.value, 0);

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
        <CardDescription>
          Current breakdown of orders grouped by status.
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[260px]'
        >
          <PieGraphClient data={chartData} totalOrders={totalOrders} />
        </ChartContainer>
      </CardContent>
      <CardFooter className='text-muted-foreground text-sm'>
        {formatNumber(totalOrders)} total orders
      </CardFooter>
    </Card>
  );
}

export const PieGraph = OrderStatusPieChart;

export default OrderStatusPieChart;
