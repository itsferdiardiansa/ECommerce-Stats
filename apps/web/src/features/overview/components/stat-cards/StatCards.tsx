import { Badge } from '@/components/ui/Badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/Card';
import { IconTrendingUp } from '@tabler/icons-react';
import {
  getTotalRevenue,
  getTotalOrderCount,
  getAverageOrderValue,
  getAverageProductRating
} from '@rufieltics/db';
import { formatCurrency, formatNumber } from '@/lib/format';

export async function TotalRevenueCard() {
  const revenue = await getTotalRevenue();

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>Total Revenue</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {formatCurrency(revenue)}
        </CardTitle>
        <CardAction>
          <Badge variant='outline'>
            <IconTrendingUp />
            Revenue
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <div className='line-clamp-1 flex gap-2 font-medium'>
          Total sales revenue <IconTrendingUp className='size-4' />
        </div>
        <div className='text-muted-foreground'>From all completed orders</div>
      </CardFooter>
    </Card>
  );
}

export async function TotalOrderCountCard() {
  const orderCount = await getTotalOrderCount();

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>Total Orders</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {formatNumber(orderCount)}
        </CardTitle>
        <CardAction>
          <Badge variant='outline'>
            <IconTrendingUp />
            Orders
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <div className='line-clamp-1 flex gap-2 font-medium'>
          All time orders <IconTrendingUp className='size-4' />
        </div>
        <div className='text-muted-foreground'>
          Total number of orders placed
        </div>
      </CardFooter>
    </Card>
  );
}

export async function AverageOrderValueCard() {
  const avgValue = await getAverageOrderValue();

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>Average Order Value</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {formatCurrency(avgValue)}
        </CardTitle>
        <CardAction>
          <Badge variant='outline'>
            <IconTrendingUp />
            AOV
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <div className='line-clamp-1 flex gap-2 font-medium'>
          Average per order <IconTrendingUp className='size-4' />
        </div>
        <div className='text-muted-foreground'>
          Mean value across all orders
        </div>
      </CardFooter>
    </Card>
  );
}

export async function AverageProductRatingCard() {
  const avgRating = await getAverageProductRating();

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>Average Rating</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {avgRating.toFixed(1)}
        </CardTitle>
        <CardAction>
          <Badge variant='outline'>
            <IconTrendingUp />
            Rating
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <div className='line-clamp-1 flex gap-2 font-medium'>
          Customer satisfaction <IconTrendingUp className='size-4' />
        </div>
        <div className='text-muted-foreground'>Average product rating</div>
      </CardFooter>
    </Card>
  );
}
